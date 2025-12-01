import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import {
  initiateMarketplacePayment,
  handleMarketplacePaymentCallback,
  checkMarketplacePaymentStatus,
  downloadMarketplaceDocument
} from '../controllers/marketplacePaymentController';

const router = Router();

// Initiate M-Pesa payment for marketplace document
router.post('/initiate', authenticateToken, initiateMarketplacePayment);

// M-Pesa callback (no auth - called by Safaricom)
router.post('/callback', handleMarketplacePaymentCallback);

// Check payment status
router.get('/:paymentId/status', authenticateToken, checkMarketplacePaymentStatus);

// Download purchased document
router.get('/download/:purchaseId', authenticateToken, downloadMarketplaceDocument);

export default router;
