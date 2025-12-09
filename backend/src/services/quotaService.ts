import { prisma } from '../utils/database';
import { LawyerTier } from '@prisma/client';
import { logger } from '../utils/logger';

// Tier-based quota limits
const AI_REVIEW_QUOTAS = {
  REGULAR_USER: 1,     // Lifetime (one-time free)
  LAWYER_FREE: 5,      // Per month
  LAWYER_LITE: 15,     // Per month
  LAWYER_PRO: 999999   // Unlimited
};

const PDF_DOWNLOAD_QUOTAS = {
  REGULAR_USER: 0,     // Must pay (except first one via freePDFDownloadUsed)
  LAWYER_FREE: 3,      // Per month
  LAWYER_LITE: 10,     // Per month
  LAWYER_PRO: 999999   // Unlimited
};

interface QuotaInfo {
  limit: number;
  used: number;
  remaining: number;
  isLawyer: boolean;
  tier?: LawyerTier;
  resetsAt?: Date;
}

/**
 * Get AI review quota for a user
 */
export async function getAIReviewQuota(userId: string): Promise<QuotaInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { lawyerProfile: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Reset quota if new month for lawyers
  await resetMonthlyQuotaIfNeeded(user);

  // Regular user: lifetime free (1 review)
  if (user.role !== 'LAWYER') {
    return {
      limit: AI_REVIEW_QUOTAS.REGULAR_USER,
      used: user.hasUsedFreeReview ? 1 : 0,
      remaining: user.hasUsedFreeReview ? 0 : 1,
      isLawyer: false
    };
  }

  // Lawyer: tier-based monthly quota
  const tier = user.lawyerProfile?.tier || LawyerTier.FREE;
  const limit = AI_REVIEW_QUOTAS[`LAWYER_${tier}` as keyof typeof AI_REVIEW_QUOTAS];
  
  const resetsAt = getNextMonthFirstDay();

  return {
    limit,
    used: user.freeAIReviewsUsed,
    remaining: Math.max(0, limit - user.freeAIReviewsUsed),
    isLawyer: true,
    tier,
    resetsAt
  };
}

/**
 * Get PDF download quota for a user
 */
export async function getPDFDownloadQuota(userId: string): Promise<QuotaInfo> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { lawyerProfile: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  await resetMonthlyQuotaIfNeeded(user);

  // Regular user: no monthly quota (only one-time free via freePDFDownloadUsed)
  if (user.role !== 'LAWYER') {
    return {
      limit: PDF_DOWNLOAD_QUOTAS.REGULAR_USER,
      used: 0,
      remaining: 0,
      isLawyer: false
    };
  }

  // Lawyer: tier-based monthly quota
  const tier = user.lawyerProfile?.tier || LawyerTier.FREE;
  const limit = PDF_DOWNLOAD_QUOTAS[`LAWYER_${tier}` as keyof typeof PDF_DOWNLOAD_QUOTAS];
  
  const resetsAt = getNextMonthFirstDay();

  return {
    limit,
    used: user.freePDFDownloadsUsed,
    remaining: Math.max(0, limit - user.freePDFDownloadsUsed),
    isLawyer: true,
    tier,
    resetsAt
  };
}

/**
 * Check and consume AI review quota
 */
export async function checkAndConsumeAIReview(userId: string): Promise<boolean> {
  const quota = await getAIReviewQuota(userId);

  if (quota.remaining <= 0) {
    logger.warn(`[QuotaService] AI review quota exhausted for user ${userId}`);
    return false;
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user?.role !== 'LAWYER') {
    // Regular user: mark hasUsedFreeReview
    await prisma.user.update({
      where: { id: userId },
      data: { hasUsedFreeReview: true }
    });
  } else {
    // Lawyer: increment monthly counter
    await prisma.user.update({
      where: { id: userId },
      data: { freeAIReviewsUsed: { increment: 1 } }
    });
  }

  logger.info(`[QuotaService] AI review quota consumed for user ${userId}. Remaining: ${quota.remaining - 1}`);
  return true;
}

/**
 * Check and consume PDF download quota
 */
export async function checkAndConsumePDFDownload(userId: string): Promise<boolean> {
  const quota = await getPDFDownloadQuota(userId);

  if (quota.remaining <= 0) {
    logger.warn(`[QuotaService] PDF download quota exhausted for user ${userId}`);
    return false;
  }

  // Lawyer: increment monthly counter
  await prisma.user.update({
    where: { id: userId },
    data: { freePDFDownloadsUsed: { increment: 1 } }
  });

  logger.info(`[QuotaService] PDF download quota consumed for user ${userId}. Remaining: ${quota.remaining - 1}`);
  return true;
}

/**
 * Reset monthly quotas if new month
 */
async function resetMonthlyQuotaIfNeeded(user: any): Promise<void> {
  if (user.role !== 'LAWYER') return;

  const now = new Date();
  const lastReset = user.lastQuotaReset;

  // Check if it's a new month
  if (!lastReset || lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        freeAIReviewsUsed: 0,
        freePDFDownloadsUsed: 0,
        lastQuotaReset: now
      }
    });

    logger.info(`[QuotaService] Monthly quotas reset for lawyer ${user.id}`);
  }
}

/**
 * Get first day of next month
 */
function getNextMonthFirstDay(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 1, 0);
}

/**
 * Reset all lawyer quotas (for cron job)
 */
export async function resetAllLawyerQuotas(): Promise<number> {
  const result = await prisma.user.updateMany({
    where: { role: 'LAWYER' },
    data: {
      freeAIReviewsUsed: 0,
      freePDFDownloadsUsed: 0,
      lastQuotaReset: new Date()
    }
  });

  logger.info(`[QuotaService] Reset quotas for ${result.count} lawyers`);
  return result.count;
}

/**
 * Get quota limits for a tier
 */
export function getQuotaLimits(tier: LawyerTier) {
  return {
    aiReviews: AI_REVIEW_QUOTAS[`LAWYER_${tier}` as keyof typeof AI_REVIEW_QUOTAS],
    pdfDownloads: PDF_DOWNLOAD_QUOTAS[`LAWYER_${tier}` as keyof typeof PDF_DOWNLOAD_QUOTAS]
  };
}
