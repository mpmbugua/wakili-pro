import express from 'express';
import {
  createPaymentIntent,
  verifyPayment,
  getPaymentHistory,
  processPayment
} from '../controllers/paymentControllerSimple';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Payment processing routes
router.post('/payment-intent', authenticateToken, createPaymentIntent);
router.post('/verify', authenticateToken, verifyPayment);
router.post('/process', authenticateToken, processPayment);
router.get('/history', authenticateToken, getPaymentHistory);

// Webhook endpoints (for future M-Pesa and Stripe integration)
// router.post('/webhooks/mpesa', handleMpesaWebhook);
// router.post('/webhooks/stripe', handleStripeWebhook);

export default router;