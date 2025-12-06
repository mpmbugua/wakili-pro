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
import {
  queryBuilder,
  generateMarketIntelligenceReport
} from '../controllers/aiDataExportController';

const router = Router();

// Public tracking endpoints (work for anonymous and authenticated users)
router.post('/track-page', optionalAuth, trackPageView);
router.post('/track-event', optionalAuth, trackEvent);
router.post('/track-session', optionalAuth, trackSession);
router.post('/track-conversion', optionalAuth, trackConversion);

// Admin-only analytics endpoints
router.get('/admin/overview', authenticateToken, authorizeRoles('ADMIN'), getAdminAnalyticsOverview);
router.get('/admin/export', authenticateToken, authorizeRoles('ADMIN'), exportAnalyticsData);

// AI Data Export & Training Tools (Admin-only)
router.post('/admin/query-builder', authenticateToken, authorizeRoles('ADMIN'), queryBuilder);
router.post('/admin/market-intelligence', authenticateToken, authorizeRoles('ADMIN'), generateMarketIntelligenceReport);

export default router;
