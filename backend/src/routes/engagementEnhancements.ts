import express from 'express';
import * as engagementController from '../controllers/engagementEnhancementsController';
import { authenticate } from '../middleware/authMiddleware';

const router = express.Router();

// Favorites
router.get('/favorites', authenticate, engagementController.listFavorites);
router.post('/favorites', authenticate, engagementController.addFavorite);
router.delete('/favorites/:id', authenticate, engagementController.removeFavorite);

// Referrals
router.get('/referrals', authenticate, engagementController.listReferrals);
router.post('/referrals', authenticate, engagementController.createReferral);

// Loyalty Points
router.get('/loyalty', authenticate, engagementController.getLoyaltyPoints);

// Notifications
router.get('/notifications', authenticate, engagementController.listNotifications);
router.post('/notifications/read', authenticate, engagementController.markNotificationRead);

// Badges
router.get('/badges', authenticate, engagementController.listBadges);

// Onboarding Progress
router.get('/onboarding', authenticate, engagementController.getOnboardingProgress);
router.post('/onboarding', authenticate, engagementController.updateOnboardingProgress);

// AI Chat History
router.get('/ai-chat', authenticate, engagementController.getAIChatHistory);
router.post('/ai-chat', authenticate, engagementController.addAIChatMessage);

export default router;
