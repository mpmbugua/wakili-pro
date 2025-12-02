import cron from 'node-cron';
import { logger } from '../utils/logger';
import { runIntelligentCrawler } from './intelligentLegalCrawler';

/**
 * Automated Legal Document Crawler Scheduler
 * Runs daily at 5:00 PM to discover and ingest new legal documents
 */
export class CrawlerScheduler {
  private cronJob: cron.ScheduledTask | null = null;

  /**
   * Start automated daily crawling at 5:00 PM
   */
  start() {
    // Schedule for 5:00 PM daily (17:00 in 24-hour format)
    // Cron format: minute hour day month day-of-week
    const cronExpression = '0 17 * * *'; // Every day at 5:00 PM

    logger.info('[Crawler Scheduler] Initializing automated legal document crawler...');
    logger.info('[Crawler Scheduler] Schedule: Daily at 5:00 PM (East Africa Time)');

    this.cronJob = cron.schedule(cronExpression, async () => {
      logger.info('[Crawler Scheduler] Starting scheduled crawl...');
      
      try {
        const result = await runIntelligentCrawler();
        
        logger.info(`[Crawler Scheduler] Crawl complete! Discovered: ${result.discovered}, Ingested: ${result.ingested}`);
        
        // TODO: Send notification to admins
        // await sendAdminNotification({
        //   subject: 'Daily Legal Document Crawl Complete',
        //   message: `Discovered ${result.discovered} documents, successfully ingested ${result.ingested}`
        // });
      } catch (error) {
        logger.error('[Crawler Scheduler] Scheduled crawl failed:', error);
        
        // TODO: Send error notification to admins
        // await sendAdminNotification({
        //   subject: 'Daily Legal Document Crawl Failed',
        //   message: `Error: ${error.message}`
        // });
      }
    }, {
      scheduled: true,
      timezone: 'Africa/Nairobi' // East Africa Time (EAT)
    });

    logger.info('[Crawler Scheduler] Scheduler started successfully');
  }

  /**
   * Stop automated crawling
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      logger.info('[Crawler Scheduler] Scheduler stopped');
    }
  }

  /**
   * Manually trigger a crawl (for testing or admin trigger)
   */
  async triggerManualCrawl(): Promise<{ discovered: number; ingested: number }> {
    logger.info('[Crawler Scheduler] Manual crawl triggered by admin');
    return await runIntelligentCrawler();
  }

  /**
   * Get next scheduled run time
   */
  getNextRunTime(): Date | null {
    // Calculate next 5:00 PM
    const now = new Date();
    const next = new Date();
    next.setHours(17, 0, 0, 0);

    // If 5:00 PM already passed today, schedule for tomorrow
    if (now.getHours() >= 17) {
      next.setDate(next.getDate() + 1);
    }

    return next;
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.cronJob !== null;
  }
}

// Singleton instance
export const crawlerScheduler = new CrawlerScheduler();
