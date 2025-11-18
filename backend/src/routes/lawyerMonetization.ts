import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import * as lawyerMonetizationController from '../controllers/lawyerMonetizationController';

const router = Router();

// Upgrade lawyer tier (Lite <-> Pro)
router.post('/tier', authenticateToken, lawyerMonetizationController.upgradeTier);

// Feature lawyer profile
router.post('/feature', authenticateToken, lawyerMonetizationController.featureProfile);

// Publish article (premium or regular)
router.post('/article', authenticateToken, lawyerMonetizationController.publishArticle);

// Pay for article or feature
router.post('/pay', authenticateToken, lawyerMonetizationController.payForMonetization);

export default router;
