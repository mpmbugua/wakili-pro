import cron from 'node-cron';
import { resetAllLawyerQuotas } from '../services/quotaService';
import { sendEmail } from '../services/emailService';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

/**
 * Quota Reset Cron Job
 * Runs on the 1st of every month at 12:01 AM
 * Resets monthly AI review and PDF download quotas for all lawyers
 */
export function initializeQuotaResetCron() {
  // Schedule: 1 0 1 * * (1st of month, 12:01 AM)
  cron.schedule('1 0 1 * *', async () => {
    logger.info('[QuotaReset] Starting monthly quota reset job...');
    
    try {
      // Reset all lawyer quotas
      const resetCount = await resetAllLawyerQuotas();
      
      logger.info(`[QuotaReset] Successfully reset quotas for ${resetCount} lawyers`);
      
      // Get all lawyers to send notifications
      const lawyers = await prisma.user.findMany({
        where: { 
          role: 'LAWYER',
          lawyerProfile: {
            isNot: null
          }
        },
        include: {
          lawyerProfile: {
            select: {
              tier: true
            }
          }
        }
      });

      // Send email notifications to lawyers
      const emailPromises = lawyers.map(async (lawyer) => {
        const tier = lawyer.lawyerProfile?.tier || 'FREE';
        const quotas = getQuotaLimits(tier);
        
        try {
          await sendEmail({
            to: lawyer.email,
            subject: 'Wakili Pro - Monthly Quotas Refreshed',
            html: `
              <h2>Your Monthly Quotas Have Been Refreshed!</h2>
              <p>Hi ${lawyer.firstName},</p>
              <p>Your Wakili Pro monthly quotas have been reset for the new month.</p>
              
              <h3>Your ${tier} Tier Quotas:</h3>
              <ul>
                <li><strong>AI Reviews:</strong> ${quotas.aiReviews === 999999 ? 'Unlimited' : quotas.aiReviews} per month</li>
                <li><strong>PDF Downloads:</strong> ${quotas.pdfDownloads === 999999 ? 'Unlimited' : quotas.pdfDownloads} per month</li>
              </ul>
              
              <p>Start using your refreshed quotas to analyze cases and download legal templates!</p>
              
              ${tier === 'FREE' ? `
                <p style="background: #f0fdf4; border: 1px solid #86efac; padding: 12px; border-radius: 8px;">
                  <strong>💡 Need more quotas?</strong><br>
                  Upgrade to LITE (15 AI reviews, 10 PDFs) for KES 2,999/month<br>
                  or PRO (Unlimited) for KES 4,999/month
                </p>
              ` : ''}
              
              <p>Best regards,<br>Wakili Pro Team</p>
            `
          });
          logger.info(`[QuotaReset] Notification sent to lawyer ${lawyer.id}`);
        } catch (emailError) {
          logger.error(`[QuotaReset] Failed to send email to lawyer ${lawyer.id}:`, emailError);
        }
      });

      await Promise.all(emailPromises);
      logger.info(`[QuotaReset] Notifications sent to ${lawyers.length} lawyers`);
      
    } catch (error) {
      logger.error('[QuotaReset] Quota reset job failed:', error);
    }
  });

  logger.info('[QuotaReset] Cron job initialized (runs 1st of month at 12:01 AM)');
}

// Helper to get quota limits based on tier
function getQuotaLimits(tier: string) {
  const AI_REVIEW_QUOTAS: Record<string, number> = {
    FREE: 5,
    LITE: 15,
    PRO: 999999
  };
  
  const PDF_DOWNLOAD_QUOTAS: Record<string, number> = {
    FREE: 3,
    LITE: 10,
    PRO: 999999
  };
  
  return {
    aiReviews: AI_REVIEW_QUOTAS[tier] || AI_REVIEW_QUOTAS.FREE,
    pdfDownloads: PDF_DOWNLOAD_QUOTAS[tier] || PDF_DOWNLOAD_QUOTAS.FREE
  };
}