import express from 'express';
import * as marketplaceEnhancementsController from '../controllers/marketplaceEnhancementsController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Advanced filtering/search
router.get('/templates', authenticate, marketplaceEnhancementsController.advancedSearchTemplates);

// Document ratings/reviews
router.post('/templates/:id/review', authenticate, marketplaceEnhancementsController.addReview);
router.get('/templates/:id/reviews', authenticate, marketplaceEnhancementsController.listReviews);

// Popularity analytics
router.get('/templates/:id/analytics', authenticate, marketplaceEnhancementsController.getAnalytics);

// Real payment integration (stub)
router.post('/purchase', authenticate, marketplaceEnhancementsController.purchaseDocument);

// Purchase limits
router.get('/purchase/limits', authenticate, marketplaceEnhancementsController.getPurchaseLimits);
router.post('/purchase/limits', authenticate, marketplaceEnhancementsController.setPurchaseLimit);

// Audit logging
router.get('/audit', authenticate, marketplaceEnhancementsController.listAuditLogs);

// Document versioning
router.get('/templates/:id/versions', authenticate, marketplaceEnhancementsController.listVersions);
router.post('/templates/:id/versions', authenticate, marketplaceEnhancementsController.addVersion);

export default router;
