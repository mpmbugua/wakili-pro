import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import { pdfSigningService } from '../services/pdfSigningService';
import { generateCertificateId } from '../services/certificateIdService';
import { generateVerificationQRCode } from '../services/qrCodeService';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Apply digital signature and stamp to document
 */
export const certifyDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { reviewId, lawyerNotes } = req.body;

    if (!userId || userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Only lawyers can certify documents'
      });
      return;
    }

    if (!reviewId) {
      res.status(400).json({
        success: false,
        message: 'Review ID is required'
      });
      return;
    }

    // 1. Get document review
    const documentReview = await prisma.documentReview.findUnique({
      where: { id: reviewId },
      include: {
        user: true,
        lawyer: {
          include: {
            lawyerProfile: true
          }
        }
      }
    });

    if (!documentReview) {
      res.status(404).json({
        success: false,
        message: 'Document review not found'
      });
      return;
    }

    // 2. Verify lawyer is assigned to this document
    if (documentReview.lawyerId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You are not assigned to this document'
      });
      return;
    }

    // 3. Get lawyer's letterhead (signature/stamp)
    const letterhead = await prisma.lawyerLetterhead.findUnique({
      where: { lawyerId: userId }
    });

    if (!letterhead) {
      res.status(400).json({
        success: false,
        message: 'Please set up your letterhead first (signature, stamp, and firm details)'
      });
      return;
    }

    if (!letterhead.signatureUrl) {
      res.status(400).json({
        success: false,
        message: 'Please upload your digital signature before certifying documents'
      });
      return;
    }

    // 4. Generate unique certificate ID
    const certificateId = generateCertificateId(letterhead.certificatePrefix);

    // 5. Get document path
    if (!documentReview.uploadedDocumentUrl) {
      res.status(400).json({
        success: false,
        message: 'No document found to certify'
      });
      return;
    }

    const documentPath = path.join(
      __dirname,
      '../../storage',
      documentReview.uploadedDocumentUrl.replace('/uploads/', '')
    );

    // 6. Sign the PDF
    const signatureImagePath = path.join(__dirname, '../../storage', letterhead.signatureUrl.replace('/uploads/', ''));
    const stampImagePath = letterhead.stampUrl
      ? path.join(__dirname, '../../storage', letterhead.stampUrl.replace('/uploads/', ''))
      : undefined;

    const certifiedDocumentUrl = await pdfSigningService.signDocument({
      documentPath,
      signatureImagePath,
      stampImagePath,
      lawyerDetails: {
        name: `${documentReview.lawyer?.firstName} ${documentReview.lawyer?.lastName}`,
        licenseNumber: letterhead.licenseNumber,
        firmName: letterhead.firmName,
        firmAddress: letterhead.firmAddress || undefined
      },
      certificateId
    });

    // 7. Generate Certificate of Authenticity
    const certificateUrl = await pdfSigningService.generateCertificate({
      certificateId,
      documentName: documentReview.originalFileName || 'Legal Document',
      lawyerName: `${documentReview.lawyer?.firstName} ${documentReview.lawyer?.lastName}`,
      licenseNumber: letterhead.licenseNumber,
      firmName: letterhead.firmName,
      firmAddress: letterhead.firmAddress || undefined,
      certificationDate: new Date()
    });

    // 8. Generate verification QR code
    const qrCodeUrl = await generateVerificationQRCode(certificateId);

    // 9. Update document review
    const updatedReview = await prisma.documentReview.update({
      where: { id: reviewId },
      data: {
        certifiedDocumentUrl,
        certificationLetterUrl: certificateUrl,
        certificateId,
        verificationQRCodeUrl: qrCodeUrl,
        signedAt: new Date(),
        signatureApplied: true,
        stampApplied: !!letterhead.stampUrl,
        letterheadApplied: true,
        certificationStatus: 'PENDING_QC', // Send to quality control
        lawyerNotes: lawyerNotes || null
      }
    });

    res.json({
      success: true,
      message: 'Document certified successfully and sent for quality control',
      data: {
        certificateId,
        certifiedDocumentUrl,
        certificateUrl,
        qrCodeUrl,
        review: updatedReview
      }
    });
  } catch (error) {
    console.error('Certify document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to certify document'
    });
  }
};

/**
 * Get lawyer's certification queue
 */
export const getCertificationQueue = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
      return;
    }

    const pendingCertifications = await prisma.documentReview.findMany({
      where: {
        lawyerId: userId,
        certificationStatus: {
          in: ['PENDING_ASSIGNMENT', 'ASSIGNED', 'IN_REVIEW']
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        deadline: 'asc'
      }
    });

    res.json({
      success: true,
      data: pendingCertifications
    });
  } catch (error) {
    console.error('Get certification queue error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve certification queue'
    });
  }
};

/**
 * Verify certificate (public endpoint)
 */
export const verifyCertificate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { certificateId } = req.params;

    if (!certificateId) {
      res.status(400).json({
        success: false,
        message: 'Certificate ID is required'
      });
      return;
    }

    const documentReview = await prisma.documentReview.findUnique({
      where: { certificateId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            lawyerProfile: {
              select: {
                licenseNumber: true
              }
            },
            lawyerLetterhead: {
              select: {
                firmName: true,
                firmAddress: true,
                licenseNumber: true
              }
            }
          }
        }
      }
    });

    if (!documentReview) {
      res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        certificateId: documentReview.certificateId,
        documentName: documentReview.originalFileName,
        documentType: documentReview.documentType,
        certifiedBy: {
          name: `${documentReview.lawyer?.firstName} ${documentReview.lawyer?.lastName}`,
          licenseNumber: documentReview.lawyer?.lawyerLetterhead?.licenseNumber || documentReview.lawyer?.lawyerProfile?.licenseNumber,
          firmName: documentReview.lawyer?.lawyerLetterhead?.firmName,
          firmAddress: documentReview.lawyer?.lawyerLetterhead?.firmAddress
        },
        certificationDate: documentReview.signedAt,
        status: documentReview.certificationStatus,
        isValid: documentReview.certificationStatus === 'COMPLETED' || documentReview.certificationStatus === 'QC_APPROVED',
        signatureApplied: documentReview.signatureApplied,
        stampApplied: documentReview.stampApplied,
        qrCodeUrl: documentReview.verificationQRCodeUrl
      }
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify certificate'
    });
  }
};
