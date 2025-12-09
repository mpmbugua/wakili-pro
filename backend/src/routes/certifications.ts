import express from 'express';
import certificationWorkflowService from '../services/certificationWorkflowService';
import documentAllocationService from '../services/documentAllocationService';
import { loadLawyerProfile, checkCertificationLimit } from '../middleware/tierCheckMiddleware';

const router = express.Router();

/**
 * GET /api/certifications/queue
 * Get available certifications for lawyer
 */
router.get('/queue', loadLawyerProfile, async (req: any, res) => {
  try {
    const { lawyerProfile } = req;

    const availableCertifications = await documentAllocationService.getAvailableCertifications(
      lawyerProfile.userId
    );

    res.json({
      certifications: availableCertifications,
      capacity: {
        monthly: {
          current: lawyerProfile.monthlyCertifications,
          limit: lawyerProfile.maxCertificationsPerMonth,
          remaining: lawyerProfile.maxCertificationsPerMonth - lawyerProfile.monthlyCertifications,
        },
        daily: {
          limit: lawyerProfile.maxCertificationsPerDay,
        },
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/certifications/:id/accept
 * Accept a certification from the queue
 */
router.post('/:id/accept', loadLawyerProfile, checkCertificationLimit, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { lawyerProfile } = req;

    const success = await documentAllocationService.acceptCertification(id, lawyerProfile.userId);

    if (success) {
      res.json({
        success: true,
        message: 'Certification accepted. You can now review the document.',
      });
    } else {
      res.status(400).json({ error: 'Failed to accept certification' });
    }
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/certifications/:id/approve
 * Approve certification
 */
router.post('/:id/approve', loadLawyerProfile, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const { lawyerProfile } = req;

    await certificationWorkflowService.approveCertification(id, lawyerProfile.userId, notes);

    res.json({
      success: true,
      message: 'Document certified successfully',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/certifications/:id/reject
 * Reject certification
 */
router.post('/:id/reject', loadLawyerProfile, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { lawyerProfile } = req;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    await certificationWorkflowService.rejectCertification(id, lawyerProfile.userId, reason);

    res.json({
      success: true,
      message: 'Certification rejected. Client will be refunded.',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/certifications/:id/request-revision
 * Request client to revise document
 */
router.post('/:id/request-revision', loadLawyerProfile, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { feedback } = req.body;
    const { lawyerProfile } = req;

    if (!feedback) {
      return res.status(400).json({ error: 'Revision feedback is required' });
    }

    await certificationWorkflowService.requestRevision(id, lawyerProfile.userId, feedback);

    res.json({
      success: true,
      message: 'Revision requested. Client will be notified.',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/certifications/:id/request-consultation
 * Request video consultation with client
 */
router.post('/:id/request-consultation', loadLawyerProfile, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { lawyerProfile } = req;

    if (!reason) {
      return res.status(400).json({ error: 'Consultation reason is required' });
    }

    const { consultationId, scheduledAt } = await certificationWorkflowService.requestConsultation(
      id,
      lawyerProfile.userId,
      reason
    );

    res.json({
      success: true,
      consultationId,
      scheduledAt,
      message: '45-minute consultation scheduled. This is included in the certification fee.',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/certifications/:id/complete-consultation
 * Mark consultation as complete and resume certification
 */
router.post('/:id/complete-consultation', loadLawyerProfile, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const { lawyerProfile } = req;

    await certificationWorkflowService.completeConsultation(id, lawyerProfile.userId, notes || '');

    res.json({
      success: true,
      message: 'Consultation completed. You can now finalize the certification.',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/certifications/stats
 * Get certification statistics for lawyer
 */
router.get('/stats', loadLawyerProfile, async (req: any, res) => {
  try {
    const { lawyerProfile } = req;

    const stats = await certificationWorkflowService.getCertificationStats(lawyerProfile.userId);

    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/certifications/my-certifications
 * Get all certifications for a lawyer
 */
router.get('/my-certifications', loadLawyerProfile, async (req: any, res) => {
  try {
    const { lawyerProfile } = req;
    const { status, page = 1, limit = 10 } = req.query;

    const where: any = { certifiedBy: lawyerProfile.userId };
    if (status) {
      where.status = status;
    }

    const certifications = await prisma.documentPurchase.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });

    const total = await prisma.documentPurchase.count({ where });

    res.json({
      certifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Import PrismaClient for the route above
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export default router;
