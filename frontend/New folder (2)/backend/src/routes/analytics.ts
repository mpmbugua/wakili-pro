import { Router } from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import {
  getDashboardAnalytics,
  getRevenueAnalytics,
  getPerformanceAnalytics,
  getUserBehaviorAnalytics
} from '../controllers/analyticsController';

const router = Router();

// Protect all analytics routes
router.use(authenticateToken);

// Dashboard analytics (all authenticated users)
router.get('/dashboard', getDashboardAnalytics);

// Revenue analytics (lawyers and admins)
router.get('/revenue', authorizeRoles('LAWYER', 'ADMIN'), getRevenueAnalytics);

// Performance analytics (lawyers only)
router.get('/performance', authorizeRoles('LAWYER'), getPerformanceAnalytics);

// User behavior analytics (admin only)
router.get('/behavior', authorizeRoles('ADMIN'), getUserBehaviorAnalytics);

export default router;