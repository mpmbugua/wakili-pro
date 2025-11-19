
import express from 'express';
import * as marketplaceEnhancementsController from '../controllers/marketplaceEnhancementsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Advanced filtering/search
router.get('/templates', authenticateToken, marketplaceEnhancementsController.advancedSearchTemplates);

// Document ratings/reviews
router.post('/templates/:id/review', authenticateToken, marketplaceEnhancementsController.addReview);
router.get('/templates/:id/reviews', authenticateToken, marketplaceEnhancementsController.listReviews);

// Popularity analytics
router.get('/templates/:id/analytics', authenticateToken, marketplaceEnhancementsController.getAnalytics);

// Real payment integration (stub)
router.post('/purchase', authenticateToken, marketplaceEnhancementsController.purchaseDocument);

// Purchase limits
router.get('/purchase/limits', authenticateToken, marketplaceEnhancementsController.getPurchaseLimits);
router.post('/purchase/limits', authenticateToken, marketplaceEnhancementsController.setPurchaseLimit);

// Audit logging
router.get('/audit', authenticateToken, marketplaceEnhancementsController.listAuditLogs);

// Document versioning
router.get('/templates/:id/versions', authenticateToken, marketplaceEnhancementsController.listVersions);
router.post('/templates/:id/versions', authenticateToken, marketplaceEnhancementsController.addVersion);

export default router;
