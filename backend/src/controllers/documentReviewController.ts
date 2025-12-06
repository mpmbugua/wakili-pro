import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import type { ApiResponse, UserRole } from '@wakili-pro/shared';
import { reviewDocumentWithAI } from '../services/documentAIReview';
import { uploadToCloudinary } from '../services/fileUploadService';

const prisma = new PrismaClient();

/**
 * Request AI review for marketplace document (FREE)
 */
export const requestMarketplaceAIReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { marketplaceDocumentId } = req.body;
    const file = req.file;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'Document file is required'
      });
      return;
    }

    if (!marketplaceDocumentId) {
      res.status(400).json({
        success: false,
        message: 'Marketplace document ID is required'
      });
      return;
    }

    // Verify user purchased this document
    const purchase = await prisma.documentPurchase.findFirst({
      where: {
        userId,
        documentId: marketplaceDocumentId
      },
      include: {
        DocumentTemplate: true
      }
    });

    if (!purchase) {
      res.status(403).json({
        success: false,
        message: 'You must purchase this document before requesting a review'
      });
      return;
    }

    // Upload file to Cloudinary
    const uploadResult = await uploadToCloudinary(
      file.buffer,
      file.originalname,
      'document-reviews'
    );

    const documentUrl = uploadResult.url;

    // Create document review record
    const documentReview = await prisma.documentReview.create({
      data: {
        userId,
        documentSource: 'MARKETPLACE',
        marketplaceDocumentId,
        uploadedDocumentUrl: documentUrl,
        originalFileName: file.originalname,
        documentType: purchase.DocumentTemplate.type,
        reviewType: 'AI_ONLY',
        price: 0, // FREE for marketplace documents
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        aiReviewStatus: 'PENDING',
        questionnaire: req.body.questionnaire || {}
      }
    });

    // Trigger AI review asynchronously
    reviewDocumentWithAI(documentReview.id, documentUrl, purchase.DocumentTemplate.type, purchase.DocumentTemplate)
      .catch(err => console.error('AI review error:', err));

    res.json({
      success: true,
      message: 'Document uploaded successfully. AI review in progress...',
      data: {
        reviewId: documentReview.id,
        estimatedCompletion: '5-10 minutes'
      }
    });
  } catch (error) {
    console.error('Request marketplace AI review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing document review request'
    });
  }
};

/**
 * Request external document AI review (PAID)
 */
export const requestExternalAIReview = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { documentType, documentCategory, urgency = 'STANDARD' } = req.body;
    const file = req.file;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!file) {
      res.status(400).json({
        success: false,
        message: 'Document file is required'
      });
      return;
    }

    if (!documentType) {
      res.status(400).json({
        success: false,
        message: 'Document type is required'
      });
      return;
    }

    // Calculate pricing
    const basePrice = 500;
    const urgencyMultiplier = urgency === 'EXPRESS' ? 2 : urgency === 'ECONOMY' ? 0.8 : 1;
    const price = basePrice * urgencyMultiplier;

    // Upload file to Cloudinary
    const uploadResult = await uploadToCloudinary(
      file.buffer,
      file.originalname,
      'document-reviews'
    );

    const documentUrl = uploadResult.url;

    // Calculate deadline based on urgency
    const hours = urgency === 'EXPRESS' ? 12 : urgency === 'ECONOMY' ? 48 : 24;
    const deadline = new Date(Date.now() + hours * 60 * 60 * 1000);

    // Create document review record
    const documentReview = await prisma.documentReview.create({
      data: {
        userId,
        documentSource: 'EXTERNAL',
        uploadedDocumentUrl: documentUrl,
        originalFileName: file.originalname,
        documentType,
        documentCategory: documentCategory || null,
        reviewType: 'AI_ONLY',
        price,
        deadline,
        urgency,
        aiReviewStatus: 'PENDING',
        questionnaire: req.body.questionnaire || {}
      }
    });

    res.json({
      success: true,
      message: 'Document uploaded successfully. Please proceed to payment.',
      data: {
        reviewId: documentReview.id,
        price,
        urgency,
        deadline,
        paymentRequired: true
      }
    });
  } catch (error) {
    console.error('Request external AI review error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing document review request'
    });
  }
};

/**
 * Request document certification
 */
export const requestCertification = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { reviewId, documentType, documentCategory, urgency = 'STANDARD' } = req.body;
    const file = req.file;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    let documentReview;

    // Check if upgrading existing AI review or new certification request
    if (reviewId) {
      documentReview = await prisma.documentReview.findUnique({
        where: { id: reviewId },
        include: {
          marketplaceDocument: true
        }
      });

      if (!documentReview || documentReview.userId !== userId) {
        res.status(404).json({
          success: false,
          message: 'Document review not found'
        });
        return;
      }

      // Calculate certification price based on document type
      const certificationPrice = calculateCertificationPrice(
        documentReview.documentType,
        documentReview.documentSource
      );

      // Update to certification
      documentReview = await prisma.documentReview.update({
        where: { id: reviewId },
        data: {
          reviewType: 'AI_PLUS_CERTIFICATION',
          certificationStatus: 'PENDING_ASSIGNMENT',
          certificationPrice,
          urgency
        },
        include: {
          marketplaceDocument: true
        }
      });

      res.json({
        success: true,
        message: 'Certification request created. Please proceed to payment.',
        data: {
          reviewId: documentReview.id,
          certificationPrice,
          totalPrice: documentReview.price + certificationPrice,
          paymentRequired: true
        }
      });
    } else {
      // New certification request with file upload
      if (!file) {
        res.status(400).json({
          success: false,
          message: 'Document file is required'
        });
        return;
      }

      if (!documentType) {
        res.status(400).json({
          success: false,
          message: 'Document type is required'
        });
        return;
      }

      // Upload file to Cloudinary
      const uploadResult = await uploadToCloudinary(
        file.buffer,
        file.originalname,
        'document-reviews'
      );

      const documentUrl = uploadResult.url;

      // Calculate pricing
      const certificationPrice = calculateCertificationPrice(documentType, 'EXTERNAL');

      // Calculate deadline (24 hours max)
      const deadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create document review record
      documentReview = await prisma.documentReview.create({
        data: {
          userId,
          documentSource: 'EXTERNAL',
          uploadedDocumentUrl: documentUrl,
          originalFileName: file.originalname,
          documentType,
          documentCategory: documentCategory || null,
          reviewType: 'CERTIFICATION',
          price: certificationPrice,
          certificationPrice,
          certificationStatus: 'PENDING_ASSIGNMENT',
          deadline,
          urgency,
          aiReviewStatus: 'PENDING',
          questionnaire: req.body.questionnaire || {}
        }
      });

      res.json({
        success: true,
        message: 'Certification request created. Please proceed to payment.',
        data: {
          reviewId: documentReview.id,
          price: certificationPrice,
          deadline,
          paymentRequired: true
        }
      });
    }
  } catch (error) {
    console.error('Request certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while processing certification request'
    });
  }
};

/**
 * Get AI review results
 */
export const getAIReviewResults = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { reviewId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const documentReview = await prisma.documentReview.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        marketplaceDocument: {
          select: {
            id: true,
            name: true,
            type: true
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

    if (documentReview.userId !== userId) {
      res.status(403).json({
        success: false,
        message: 'You do not have permission to view this review'
      });
      return;
    }

    res.json({
      success: true,
      data: documentReview
    });
  } catch (error) {
    console.error('Get AI review results error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching review results'
    });
  }
};

/**
 * Get user's document reviews
 */
export const getUserDocumentReviews = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const documentReviews = await prisma.documentReview.findMany({
      where: { userId },
      include: {
        marketplaceDocument: {
          select: {
            id: true,
            name: true,
            type: true
          }
        },
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: documentReviews
    });
  } catch (error) {
    console.error('Get user document reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching document reviews'
    });
  }
};

/**
 * Helper function to calculate certification price
 */
function calculateCertificationPrice(documentType: string, source: string): number {
  const MARKETPLACE_CERTIFICATION_PRICES: Record<string, number> = {
    'EMPLOYMENT_CONTRACT': 2500,
    'RENTAL_AGREEMENT': 2000,
    'BUSINESS_CONTRACT': 3500,
    'PARTNERSHIP_AGREEMENT': 4000,
    'default': 3000
  };

  const EXTERNAL_CERTIFICATION_PRICES: Record<string, number> = {
    'simple': 3000,
    'standard': 5000,
    'complex': 8000
  };

  if (source === 'MARKETPLACE') {
    return MARKETPLACE_CERTIFICATION_PRICES[documentType] || MARKETPLACE_CERTIFICATION_PRICES['default'];
  } else {
    // For external, use default standard price
    return EXTERNAL_CERTIFICATION_PRICES['standard'];
  }
}
