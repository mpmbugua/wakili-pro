
import express from 'express';
import * as engagementController from '../controllers/engagementEnhancementsController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();


// Favorites
router.get('/favorites', authenticateToken, engagementController.listFavorites);
router.post('/favorites', authenticateToken, engagementController.addFavorite);
router.delete('/favorites/:id', authenticateToken, engagementController.removeFavorite);

// Referrals
router.get('/referrals', authenticateToken, engagementController.listReferrals);
router.post('/referrals', authenticateToken, engagementController.createReferral);

// Loyalty Points
router.get('/loyalty', authenticateToken, engagementController.getLoyaltyPoints);

// Notifications
router.get('/notifications', authenticateToken, engagementController.listNotifications);
router.post('/notifications/read', authenticateToken, engagementController.markNotificationRead);

// Badges
router.get('/badges', authenticateToken, engagementController.listBadges);

// Onboarding Progress
router.get('/onboarding', authenticateToken, engagementController.getOnboardingProgress);
router.post('/onboarding', authenticateToken, engagementController.updateOnboardingProgress);

// AI Chat History
router.get('/ai-chat', authenticateToken, engagementController.getAIChatHistory);
router.post('/ai-chat', authenticateToken, engagementController.addAIChatMessage);

export default router;
