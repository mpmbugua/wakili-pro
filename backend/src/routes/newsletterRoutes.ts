import express from 'express';
import { subscribeToNewsletter, unsubscribeFromNewsletter } from '../controllers/newsletterController';

const router = express.Router();

// Public routes - no authentication required
router.post('/subscribe', subscribeToNewsletter);
router.post('/unsubscribe', unsubscribeFromNewsletter);

export default router;
