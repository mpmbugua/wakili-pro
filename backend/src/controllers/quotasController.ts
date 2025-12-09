import { Request, Response } from 'express';
import * as quotaService from '../services/quotaService';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Get current quota status for lawyer
 * GET /api/quotas/status
 */
export const getQuotaStatus = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Check if user is a lawyer
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user || user.role !== 'LAWYER') {
      return res.status(403).json({
        success: false,
        error: 'This endpoint is only available for lawyers'
      });
    }

    // Fetch both quota types
    const [aiReviewQuota, pdfDownloadQuota] = await Promise.all([
      quotaService.getAIReviewQuota(userId),
      quotaService.getPDFDownloadQuota(userId)
    ]);

    return res.json({
      success: true,
      data: {
        aiReviews: {
          limit: aiReviewQuota.limit,
          used: aiReviewQuota.used,
          remaining: aiReviewQuota.remaining,
          resetsAt: aiReviewQuota.resetsAt,
          isUnlimited: aiReviewQuota.limit === 999999
        },
        pdfDownloads: {
          limit: pdfDownloadQuota.limit,
          used: pdfDownloadQuota.used,
          remaining: pdfDownloadQuota.remaining,
          resetsAt: pdfDownloadQuota.resetsAt,
          isUnlimited: pdfDownloadQuota.limit === 999999
        },
        tier: aiReviewQuota.tier,
        nextResetDate: aiReviewQuota.resetsAt
      }
    });
  } catch (error) {
    logger.error('[Quotas] Error fetching quota status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch quota status'
    });
  }
};
