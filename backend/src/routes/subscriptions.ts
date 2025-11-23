import express from 'express';
import subscriptionService from '../services/subscriptionService';
import { loadLawyerProfile } from '../middleware/tierCheckMiddleware';
import { LawyerTier } from '@prisma/client';

const router = express.Router();

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
 * Initiate subscription upgrade
 */
router.post('/upgrade', loadLawyerProfile, async (req: any, res) => {
  try {
    const { targetTier } = req.body;
    const { lawyerProfile } = req;

    if (!Object.values(LawyerTier).includes(targetTier)) {
      return res.status(400).json({ error: 'Invalid tier' });
    }

    const result = await subscriptionService.createSubscription(
      lawyerProfile.userId,
      targetTier as LawyerTier
    );

    res.json({
      success: true,
      subscriptionId: result.subscriptionId,
      paymentRequired: result.paymentRequired,
      checkoutUrl: result.checkoutUrl,
      message: result.paymentRequired
        ? 'Please complete M-Pesa payment on your phone'
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
      const { MerchantRequestID, ResultCode } = Body.stkCallback;
      
      if (ResultCode === 0) {
        // Payment successful
        const actualTransactionId = MerchantRequestID;
        await subscriptionService.confirmSubscriptionPayment(subscriptionId, actualTransactionId);
        
        return res.json({ success: true, message: 'Subscription activated' });
      } else {
        return res.status(400).json({ error: 'Payment failed' });
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
