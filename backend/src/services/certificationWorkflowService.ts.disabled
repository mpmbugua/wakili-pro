import { PrismaClient, DocumentStatus, VideoConsultationStatus } from '@prisma/client';
import pricingService from './pricingService';

const prisma = new PrismaClient();

/**
 * Approve certification and generate certified document
 */
export const approveCertification = async (
  documentPurchaseId: string,
  lawyerId: string,
  notes?: string
): Promise<void> => {
  const documentPurchase = await prisma.documentPurchase.findUnique({
    where: { id: documentPurchaseId },
    include: {
      template: true,
      user: true,
      certifier: true,
    },
  });

  if (!documentPurchase) {
    throw new Error('Document purchase not found');
  }

  if (documentPurchase.certifiedBy !== lawyerId) {
    throw new Error('Unauthorized: You are not assigned to this document');
  }

  if (documentPurchase.status !== DocumentStatus.UNDER_REVIEW) {
    throw new Error(`Cannot approve document in ${documentPurchase.status} status`);
  }

  // Calculate review time
  const purchasedAt = documentPurchase.purchasedAt;
  const now = new Date();
  const reviewTimeHours = (now.getTime() - purchasedAt.getTime()) / (1000 * 60 * 60);

  // Update lawyer's average certification time
  const lawyer = documentPurchase.certifier;
  if (lawyer) {
    const totalCerts = lawyer.certificationCount || 1;
    const currentAvg = lawyer.avgCertificationTimeHours || 0;
    const newAvg = (currentAvg * (totalCerts - 1) + reviewTimeHours) / totalCerts;

    await prisma.lawyerProfile.update({
      where: { userId: lawyerId },
      data: {
        avgCertificationTimeHours: newAvg,
        certificationCompletionRate:
          ((lawyer.certificationCount || 0) + 1) / ((lawyer.certificationCount || 0) + 1), // Will be more sophisticated
      },
    });
  }

  // Generate certified PDF with letterhead (if PRO tier)
  const certifiedDocUrl = await generateCertifiedDocument(
    documentPurchase.documentUrl!,
    lawyer,
    documentPurchase.template.name
  );

  // Calculate certification fee and create payment record
  const certificationPricing = pricingService.calculateCertificationPricing(
    lawyer!.tier,
    lawyer!.pricingTier,
    documentPurchase.template.complexity,
    documentPurchase.template.category
  );

  const payment = await pricingService.recordPayment(
    documentPurchase.userId,
    'DOCUMENT_CERTIFICATION',
    certificationPricing,
    undefined, // No booking for certifications
    'MPESA',
    `CERT-${documentPurchaseId}`
  );

  // Link payment to document purchase
  await prisma.documentPurchase.update({
    where: { id: documentPurchaseId },
    data: {
      status: DocumentStatus.CERTIFIED,
      certifiedAt: now,
      certifiedDocUrl,
      certificationFee: certificationPricing.grossAmount,
      reviewTimeHours,
      consultationNotes: notes,
      paymentId: payment.id,
    },
  });

  // Send notification to client
  await prisma.notification.create({
    data: {
      userId: documentPurchase.userId,
      type: 'CERTIFICATION_COMPLETED',
      title: 'Document Certified!',
      message: `Your ${documentPurchase.template.name} has been reviewed and certified. Download now.`,
      isRead: false,
    },
  });

  // Update pricing tier if milestone reached
  if (lawyer && (lawyer.certificationCount + 1) % 10 === 0) {
    await pricingService.updateLawyerPricingTier(lawyerId);
  }
};

/**
 * Reject certification with feedback
 */
export const rejectCertification = async (
  documentPurchaseId: string,
  lawyerId: string,
  reason: string
): Promise<void> => {
  const documentPurchase = await prisma.documentPurchase.findUnique({
    where: { id: documentPurchaseId },
  });

  if (!documentPurchase) {
    throw new Error('Document purchase not found');
  }

  if (documentPurchase.certifiedBy !== lawyerId) {
    throw new Error('Unauthorized: You are not assigned to this document');
  }

  await prisma.documentPurchase.update({
    where: { id: documentPurchaseId },
    data: {
      status: DocumentStatus.REJECTED,
      consultationNotes: reason,
    },
  });

  // Refund client
  if (documentPurchase.paymentId) {
    await prisma.refund.create({
      data: {
        paymentId: documentPurchase.paymentId,
        userId: documentPurchase.userId,
        amount: documentPurchase.certificationFee || 0,
        reason: `Document rejected by lawyer: ${reason}`,
        status: 'PENDING',
        requestedBy: lawyerId,
      },
    });
  }

  // Notify client
  await prisma.notification.create({
    data: {
      userId: documentPurchase.userId,
      type: 'CERTIFICATION_REJECTED',
      title: 'Certification Not Possible',
      message: `Unfortunately, we cannot certify your document. Reason: ${reason}. You will receive a full refund.`,
      isRead: false,
    },
  });

  // Decrement lawyer's certification count (didn't complete)
  await prisma.lawyerProfile.update({
    where: { userId: lawyerId },
    data: {
      monthlyCertifications: { decrement: 1 },
    },
  });
};

/**
 * Request revision from client
 */
export const requestRevision = async (
  documentPurchaseId: string,
  lawyerId: string,
  feedback: string
): Promise<void> => {
  const documentPurchase = await prisma.documentPurchase.findUnique({
    where: { id: documentPurchaseId },
  });

  if (!documentPurchase) {
    throw new Error('Document purchase not found');
  }

  if (documentPurchase.certifiedBy !== lawyerId) {
    throw new Error('Unauthorized');
  }

  await prisma.documentPurchase.update({
    where: { id: documentPurchaseId },
    data: {
      status: DocumentStatus.REVISION_NEEDED,
      consultationNotes: feedback,
    },
  });

  await prisma.notification.create({
    data: {
      userId: documentPurchase.userId,
      type: 'REVISION_REQUESTED',
      title: 'Document Needs Revision',
      message: `The lawyer has requested changes to your document. Review feedback and resubmit.`,
      isRead: false,
    },
  });
};

/**
 * Request video consultation during certification
 */
export const requestConsultation = async (
  documentPurchaseId: string,
  lawyerId: string,
  reason: string
): Promise<{ consultationId: string; scheduledAt: Date }> => {
  const documentPurchase = await prisma.documentPurchase.findUnique({
    where: { id: documentPurchaseId },
    include: { user: true },
  });

  if (!documentPurchase) {
    throw new Error('Document purchase not found');
  }

  if (documentPurchase.certifiedBy !== lawyerId) {
    throw new Error('Unauthorized');
  }

  // Schedule consultation for next available slot (simplified - would use real scheduling)
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + 24); // Schedule 24 hours ahead

  // Create service booking for consultation
  const booking = await prisma.serviceBooking.create({
    data: {
      clientId: documentPurchase.userId,
      providerId: lawyerId,
      serviceId: 'CERTIFICATION_CONSULTATION', // Special service type
      status: 'CONFIRMED',
      scheduledAt,
    },
  });

  // Create video consultation
  const roomId = `cert-${documentPurchaseId}-${Date.now()}`;
  const consultation = await prisma.videoConsultation.create({
    data: {
      bookingId: booking.id,
      lawyerId,
      clientId: documentPurchase.userId,
      roomId,
      scheduledAt,
      isRecorded: true,
      status: VideoConsultationStatus.SCHEDULED,
    },
  });

  // Update document purchase
  await prisma.documentPurchase.update({
    where: { id: documentPurchaseId },
    data: {
      status: DocumentStatus.CONSULTATION_REQUIRED,
      requiresConsultation: true,
      consultationBookingId: booking.id,
      consultationNotes: reason,
    },
  });

  // Notify client
  await prisma.notification.create({
    data: {
      userId: documentPurchase.userId,
      type: 'CONSULTATION_SCHEDULED',
      title: 'Video Consultation Scheduled',
      message: `A 45-minute consultation has been scheduled for ${scheduledAt.toLocaleString()}. This is included in your certification fee.`,
      isRead: false,
    },
  });

  return {
    consultationId: consultation.id,
    scheduledAt,
  };
};

/**
 * Complete consultation and resume certification
 */
export const completeConsultation = async (
  documentPurchaseId: string,
  lawyerId: string,
  consultationNotes: string
): Promise<void> => {
  await prisma.documentPurchase.update({
    where: { id: documentPurchaseId },
    data: {
      status: DocumentStatus.UNDER_REVIEW,
      consultationNotes,
    },
  });

  await prisma.notification.create({
    data: {
      userId: (
        await prisma.documentPurchase.findUnique({
          where: { id: documentPurchaseId },
        })
      )!.userId,
      type: 'CONSULTATION_COMPLETED',
      title: 'Consultation Completed',
      message: 'Your consultation is complete. The lawyer will now finalize certification.',
      isRead: false,
    },
  });
};

/**
 * Generate certified PDF with letterhead
 */
async function generateCertifiedDocument(
  documentUrl: string,
  lawyer: any,
  templateName: string
): Promise<string> {
  // If lawyer has letterhead (PRO tier), merge with document
  if (lawyer.firmLetterhead && lawyer.tier === 'PRO') {
    // TODO: Implement PDF merging with letterhead
    // This would use a library like pdf-lib to:
    // 1. Load the original document PDF
    // 2. Load the firm's letterhead template
    // 3. Add certification stamp with lawyer's details
    // 4. Add digital signature (optional)
    // 5. Save to storage

    const certifiedUrl = `${documentUrl.replace('.pdf', '')}-certified-${lawyer.firmName}.pdf`;
    return certifiedUrl;
  }

  // Standard certification without letterhead
  const certifiedUrl = `${documentUrl.replace('.pdf', '')}-certified.pdf`;
  return certifiedUrl;
}

/**
 * Get certification statistics for lawyer dashboard
 */
export const getCertificationStats = async (lawyerId: string) => {
  const lawyer = await prisma.lawyerProfile.findUnique({
    where: { userId: lawyerId },
  });

  const certifications = await prisma.documentPurchase.findMany({
    where: { certifiedBy: lawyerId },
  });

  const totalEarnings = certifications.reduce(
    (sum, cert) => sum + (cert.certificationFee || 0),
    0
  );

  const statusCounts = {
    UNDER_REVIEW: certifications.filter(c => c.status === DocumentStatus.UNDER_REVIEW).length,
    CERTIFIED: certifications.filter(c => c.status === DocumentStatus.CERTIFIED).length,
    REJECTED: certifications.filter(c => c.status === DocumentStatus.REJECTED).length,
    CONSULTATION_REQUIRED: certifications.filter(
      c => c.status === DocumentStatus.CONSULTATION_REQUIRED
    ).length,
  };

  const avgRating =
    certifications.filter(c => c.clientRating).reduce((sum, c) => sum + c.clientRating!, 0) /
      certifications.filter(c => c.clientRating).length || 0;

  return {
    total: certifications.length,
    monthly: lawyer?.monthlyCertifications || 0,
    limit: lawyer?.maxCertificationsPerMonth || 0,
    totalEarnings,
    avgRating,
    avgReviewTime: lawyer?.avgCertificationTimeHours || 0,
    completionRate: lawyer?.certificationCompletionRate || 0,
    statusCounts,
  };
};

export default {
  approveCertification,
  rejectCertification,
  requestRevision,
  requestConsultation,
  completeConsultation,
  getCertificationStats,
};
