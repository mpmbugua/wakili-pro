import { Router } from 'express';
import { authenticateJWT } from '../middleware/authMiddleware';
import {
  initiateMarketplacePayment,
  handleMarketplacePaymentCallback,
  checkMarketplacePaymentStatus,
  downloadMarketplaceDocument
} from '../controllers/marketplacePaymentController';

const router = Router();

// Initiate M-Pesa payment for marketplace document
router.post('/initiate', authenticateJWT, initiateMarketplacePayment);

// M-Pesa callback (no auth - called by Safaricom)
router.post('/callback', handleMarketplacePaymentCallback);

// Check payment status
router.get('/:paymentId/status', authenticateJWT, checkMarketplacePaymentStatus);

// Download purchased document
router.get('/download/:purchaseId', authenticateJWT, downloadMarketplaceDocument);

export default router;
