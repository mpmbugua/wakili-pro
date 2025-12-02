import express from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth';
import { crawlerScheduler } from '../../services/crawlerScheduler';
import { logger } from '../../utils/logger';

const router = express.Router();

/**
 * GET /api/admin/crawler/status
 * Get crawler scheduler status
 */
router.get('/status', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    const isRunning = crawlerScheduler.isRunning();
    const nextRun = crawlerScheduler.getNextRunTime();

    res.json({
      success: true,
      data: {
        isRunning,
        nextRun: nextRun?.toISOString(),
        nextRunFormatted: nextRun?.toLocaleString('en-KE', { 
          timeZone: 'Africa/Nairobi',
          dateStyle: 'full',
          timeStyle: 'short'
        }),
        schedule: 'Daily at 5:00 PM (East Africa Time)'
      }
    });
  } catch (error) {
    logger.error('[Crawler API] Error fetching status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crawler status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/crawler/trigger
 * Manually trigger an immediate crawl (runs in background)
 */
router.post('/trigger', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    logger.info(`[Crawler API] Manual crawl triggered by user: ${req.user?.email}`);

    // Run crawler in background (don't wait for completion)
    crawlerScheduler.triggerManualCrawl()
      .then(result => {
        logger.info(`[Crawler API] Background crawl complete: Discovered ${result.discovered}, Ingested ${result.ingested}`);
      })
      .catch(error => {
        logger.error('[Crawler API] Background crawl failed:', error);
      });

    // Respond immediately
    res.json({
      success: true,
      message: 'Crawler started in background. Check logs for progress. Results will appear in 5-10 minutes.',
      data: {
        status: 'running',
        estimatedTime: '5-10 minutes for first results'
      }
    });
  } catch (error) {
    logger.error('[Crawler API] Failed to trigger manual crawl:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger manual crawl',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/crawler/start
 * Start the automated crawler scheduler
 */
router.post('/start', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    crawlerScheduler.start();
    const nextRun = crawlerScheduler.getNextRunTime();

    logger.info(`[Crawler API] Scheduler started by user: ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Crawler scheduler started',
      data: {
        nextRun: nextRun?.toISOString(),
        schedule: 'Daily at 5:00 PM (East Africa Time)'
      }
    });
  } catch (error) {
    logger.error('[Crawler API] Failed to start scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start crawler scheduler',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/crawler/stop
 * Stop the automated crawler scheduler
 */
router.post('/stop', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    crawlerScheduler.stop();

    logger.info(`[Crawler API] Scheduler stopped by user: ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Crawler scheduler stopped'
    });
  } catch (error) {
    logger.error('[Crawler API] Failed to stop scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop crawler scheduler',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
