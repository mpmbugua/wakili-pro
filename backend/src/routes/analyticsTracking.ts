import { Router } from 'express';
import { authenticateToken, authorizeRoles, optionalAuth } from '../middleware/auth';
import {
  trackPageView,
  trackEvent,
  trackSession,
  trackConversion,
  getAdminAnalyticsOverview,
  exportAnalyticsData
} from '../controllers/analyticsTrackingController';

const router = Router();

// Public tracking endpoints (work for anonymous and authenticated users)
router.post('/track-page', optionalAuth, trackPageView);
router.post('/track-event', optionalAuth, trackEvent);
router.post('/track-session', optionalAuth, trackSession);
router.post('/track-conversion', optionalAuth, trackConversion);

// Admin-only analytics endpoints
router.get('/admin/overview', authenticateToken, authorizeRoles('ADMIN'), getAdminAnalyticsOverview);
router.get('/admin/export', authenticateToken, authorizeRoles('ADMIN'), exportAnalyticsData);

export default router;
