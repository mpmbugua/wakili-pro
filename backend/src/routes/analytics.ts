import { Router, Request, Response } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import {
  getDashboardAnalytics,
  getRevenueAnalytics,
  getPerformanceAnalytics,
  getUserBehaviorAnalytics
} from '../controllers/analyticsController';
import * as analyticsService from '../services/analyticsService';
import { logger } from '../utils/logger';


import type { Router as ExpressRouter } from 'express';
const router: ExpressRouter = Router();

interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

// Feature event logging (all authenticated users)

// Protect all analytics routes
router.use(authenticateToken);

/**
 * POST /api/analytics/track
 * Track analytics event from frontend (freebie tracking system)
 */
router.post('/track', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { eventName, properties, timestamp, url, userAgent, screenResolution } = req.body;

    if (!eventName) {
      return res.status(400).json({
        success: false,
        error: 'Event name is required'
      });
    }

    // Track event with all metadata
    await analyticsService.trackEvent(
      eventName,
      {
        ...properties,
        url,
        userAgent,
        screenResolution
      },
      userId,
      req.ip
    );

    return res.json({
      success: true,
      message: 'Event tracked successfully'
    });
  } catch (error) {
    logger.error('[Analytics] Error tracking event:', error);
    // Non-blocking - return success even on error
    return res.json({
      success: true,
      message: 'Event tracking attempted'
    });
  }
});

// Dashboard analytics (all authenticated users)
router.get('/dashboard', getDashboardAnalytics);

// Revenue analytics (lawyers and admins)
router.get('/revenue', authorizeRoles('LAWYER', 'ADMIN'), getRevenueAnalytics);

// Performance analytics (lawyers only)
router.get('/performance', authorizeRoles('LAWYER'), getPerformanceAnalytics);

// User behavior analytics (admin only)
router.get('/behavior', authorizeRoles('ADMIN'), getUserBehaviorAnalytics);

export default router;