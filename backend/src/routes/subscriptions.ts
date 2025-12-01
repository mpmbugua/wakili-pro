import express from 'express';
import subscriptionService from '../services/subscriptionService';
import { loadLawyerProfile } from '../middleware/tierCheckMiddleware';
import { LawyerTier } from '@prisma/client';

const router = express.Router();

/**
 * POST /api/subscriptions/create
 * Create subscription record (without payment)
 */
router.post('/create', loadLawyerProfile, async (req: any, res) => {
  try {
    const { targetTier, billingCycle = 'monthly' } = req.body;
    const { lawyerProfile } = req;

    if (!Object.values(LawyerTier).includes(targetTier)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid tier' 
      });
    }

    // Create subscription record (PENDING status)
    const result = await subscriptionService.createSubscription(
      lawyerProfile.userId,
      targetTier as LawyerTier,
      billingCycle
    );

    // Calculate amount for payment
    const SUBSCRIPTION_FEES = {
      FREE: 0,
      LITE: 1999,
      PRO: 4999,
    };

    const amount = SUBSCRIPTION_FEES[targetTier as keyof typeof SUBSCRIPTION_FEES] || 0;

    res.json({
      success: true,
      data: {
        subscriptionId: result.subscriptionId,
        amount,
        tier: targetTier,
        billingCycle,
      },
      message: 'Subscription created. Please complete payment.',
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

/**
 * GET /api/subscriptions/tiers
 * Get tier comparison data
 */
router.get('/tiers', (req, res) => {
  try {
    const tiers = subscriptionService.getTierComparison();
    res.json(tiers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/subscriptions/current
 * Get current subscription status
 */
router.get('/current', loadLawyerProfile, async (req: any, res) => {
  try {
    const { lawyerProfile } = req;
    
    res.json({
      currentTier: lawyerProfile.tier,
      pricingTier: lawyerProfile.pricingTier,
      usage: {
        bookings: {
          current: lawyerProfile.monthlyBookings,
          limit: lawyerProfile.maxBookingsPerMonth,
          percentage: (lawyerProfile.monthlyBookings / lawyerProfile.maxBookingsPerMonth) * 100,
        },
        certifications: {
          current: lawyerProfile.monthlyCertifications,
          limit: lawyerProfile.maxCertificationsPerMonth,
          percentage: lawyerProfile.maxCertificationsPerMonth > 0 
            ? (lawyerProfile.monthlyCertifications / lawyerProfile.maxCertificationsPerMonth) * 100
            : 0,
        },
        services: {
          current: lawyerProfile.monthlyServices,
          limit: lawyerProfile.maxServicesPerMonth,
          percentage: (lawyerProfile.monthlyServices / lawyerProfile.maxServicesPerMonth) * 100,
        },
        specializations: {
          current: lawyerProfile.specializations?.length || 0,
          limit: lawyerProfile.maxSpecializations,
        },
      },
      usageResetAt: lawyerProfile.usageResetAt,
      subscriptions: lawyerProfile.subscriptions,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/upgrade
 * Initiate subscription upgrade with M-Pesa payment
 */
router.post('/upgrade', loadLawyerProfile, async (req: any, res) => {
  try {
    const { targetTier, phoneNumber, billingCycle = 'monthly' } = req.body;
    const { lawyerProfile } = req;

    if (!Object.values(LawyerTier).includes(targetTier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    // For paid tiers, phone number is required
    if (targetTier !== LawyerTier.FREE && !phoneNumber) {
      return res.status(400).json({ error: 'Phone number required for M-Pesa payment' });
    }

    // Temporarily update lawyer phone number if provided
    if (phoneNumber && phoneNumber !== lawyerProfile.phoneNumber) {
      await require('../utils/database').prisma.lawyerProfile.update({
        where: { id: lawyerProfile.id },
        data: { phoneNumber },
      });
    }

    const result = await subscriptionService.createSubscription(
      lawyerProfile.userId,
      targetTier as LawyerTier,
      billingCycle
    );

    res.json({
      success: true,
      subscriptionId: result.subscriptionId,
      paymentRequired: result.paymentRequired,
      checkoutRequestID: result.checkoutUrl,
      message: result.paymentRequired
        ? 'Please check your phone and enter M-Pesa PIN to complete payment'
        : 'Tier updated successfully',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/confirm
 * Confirm subscription payment (M-Pesa callback)
 */
router.post('/confirm', async (req, res) => {
  try {
    const { subscriptionId, transactionId, Body } = req.body;

    // M-Pesa callback format handling
    if (Body?.stkCallback) {
      const { CheckoutRequestID, ResultCode, CallbackMetadata } = Body.stkCallback;
      
      if (ResultCode === 0) {
        // Payment successful - find subscription by CheckoutRequestID
        const prisma = require('../utils/database').prisma;
        const subscription = await prisma.subscription.findFirst({
          where: {
            metadata: {
              path: ['checkoutRequestID'],
              equals: CheckoutRequestID,
            },
          },
        });

        if (subscription) {
          // Extract M-Pesa receipt number
          let mpesaReceiptNumber = CheckoutRequestID;
          if (CallbackMetadata?.Item) {
            const receiptItem = CallbackMetadata.Item.find((item: any) => item.Name === 'MpesaReceiptNumber');
            if (receiptItem) {
              mpesaReceiptNumber = receiptItem.Value;
            }
          }

          await subscriptionService.confirmSubscriptionPayment(subscription.id, mpesaReceiptNumber);
        }
        
        return res.json({ success: true, message: 'Subscription activated' });
      } else {
        return res.status(200).json({ success: false, message: 'Payment failed' });
      }
    }

    // Direct confirmation (testing)
    if (subscriptionId && transactionId) {
      await subscriptionService.confirmSubscriptionPayment(subscriptionId, transactionId);
      return res.json({ success: true, message: 'Subscription activated' });
    }

    res.status(400).json({ error: 'Invalid request' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/subscriptions/payment-status/:subscriptionId
 * Check subscription payment status
 */
router.get('/payment-status/:subscriptionId', async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const prisma = require('../utils/database').prisma;

    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    res.json({
      success: true,
      data: {
        subscriptionId: subscription.id,
        status: subscription.status,
        tier: subscription.tier,
        monthlyFee: subscription.monthlyFee,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/cancel
 * Cancel subscription (will downgrade at end of period)
 */
router.post('/cancel', loadLawyerProfile, async (req: any, res) => {
  try {
    const { lawyerProfile } = req;

    await subscriptionService.cancelSubscription(lawyerProfile.userId);

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period',
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * POST /api/subscriptions/calculate-savings
 * Calculate potential savings/earnings for tier upgrade
 */
router.post('/calculate-savings', loadLawyerProfile, async (req: any, res) => {
  try {
    const { lawyerProfile } = req;
    const { estimatedMonthlyBookings, estimatedMonthlyCertifications } = req.body;

    const currentTier = lawyerProfile.tier;
    const avgBookingValue = 10000; // KES - would come from actual data

    // Calculate earnings for different tiers
    const calculateEarnings = (tier: LawyerTier) => {
      const bookingCommission = tier === LawyerTier.FREE ? 0.50 : 0.30;
      const certCommission = tier === LawyerTier.PRO ? 0.15 : 0.20;
      
      const bookingEarnings = estimatedMonthlyBookings * avgBookingValue * (1 - bookingCommission) * 0.95; // After WHT
      const certEarnings = estimatedMonthlyCertifications * 2500 * (1 - certCommission) * 0.95;
      
      const subscriptionCost = tier === LawyerTier.FREE ? 0 : tier === LawyerTier.LITE ? 1999 : 4999;
      
      return bookingEarnings + certEarnings - subscriptionCost;
    };

    const earnings = {
      FREE: calculateEarnings(LawyerTier.FREE),
      LITE: calculateEarnings(LawyerTier.LITE),
      PRO: calculateEarnings(LawyerTier.PRO),
    };

    const recommendations = [];
    if (earnings.LITE > earnings[currentTier]) {
      recommendations.push({
        tier: 'LITE',
        additionalEarnings: earnings.LITE - earnings[currentTier],
        breakEvenBookings: 2,
      });
    }
    if (earnings.PRO > earnings[currentTier]) {
      recommendations.push({
        tier: 'PRO',
        additionalEarnings: earnings.PRO - earnings[currentTier],
        breakEvenGMV: 33000,
      });
    }

    res.json({
      currentEarnings: earnings[currentTier],
      projectedEarnings: earnings,
      recommendations,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
