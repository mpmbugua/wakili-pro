import { PrismaClient, LawyerTier, SubscriptionStatus } from '@prisma/client';
import { mpesaService } from './mpesaDarajaService';

const prisma = new PrismaClient();

const SUBSCRIPTION_FEES = {
  FREE: 0,
  LITE: 1999, // KES per month
  PRO: 4999,  // KES per month
};

const TIER_LIMITS = {
  FREE: {
    maxSpecializations: 1,
    maxServicesPerMonth: 1,
    maxBookingsPerMonth: 2,
    maxCertificationsPerMonth: 0,
  },
  LITE: {
    maxSpecializations: 2,
    maxServicesPerMonth: 5,
    maxBookingsPerMonth: 10,
    maxCertificationsPerMonth: 5,
  },
  PRO: {
    maxSpecializations: 999,
    maxServicesPerMonth: 999,
    maxBookingsPerMonth: 999,
    maxCertificationsPerMonth: 999,
  },
};

/**
 * Initiate subscription upgrade
 */
export const createSubscription = async (
  lawyerId: string,
  targetTier: LawyerTier
): Promise<{ subscriptionId: string; paymentRequired: boolean; checkoutUrl?: string }> => {
  const lawyer = await prisma.lawyerProfile.findUnique({
    where: { userId: lawyerId },
    include: { subscriptions: { where: { status: 'ACTIVE' } } },
  });

  if (!lawyer) {
    throw new Error('Lawyer profile not found');
  }

  // Check if downgrade
  const currentTier = lawyer.tier;
  const isDowngrade = getTierLevel(targetTier) < getTierLevel(currentTier);

  if (isDowngrade) {
    throw new Error('Downgrades must be handled separately');
  }

  // Calculate billing dates
  const now = new Date();
  const currentPeriodStart = now;
  const currentPeriodEnd = new Date(now);
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

  const monthlyFee = SUBSCRIPTION_FEES[targetTier];

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      lawyerId,
      tier: targetTier,
      status: monthlyFee === 0 ? 'ACTIVE' : 'PENDING',
      currentPeriodStart,
      currentPeriodEnd,
      monthlyFee,
      paymentMethod: 'MPESA',
      nextBillingDate: currentPeriodEnd,
      upgradesFrom: currentTier,
    },
  });

  // If FREE tier, activate immediately
  if (monthlyFee === 0) {
    await activateSubscription(subscription.id);
    return { subscriptionId: subscription.id, paymentRequired: false };
  }

  // Initiate M-Pesa payment
  const phoneNumber = lawyer.phoneNumber;
  if (!phoneNumber) {
    throw new Error('Phone number required for M-Pesa payment');
  }

  try {
    const mpesaResponse = await mpesaService.initiateSTKPush({
      phoneNumber,
      amount: monthlyFee,
      accountReference: `SUB-${subscription.id.substring(0, 8)}`,
      transactionDesc: `Wakili Pro ${targetTier} Subscription`,
    });

    // Store M-Pesa request IDs in subscription metadata
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        metadata: {
          merchantRequestID: mpesaResponse.MerchantRequestID,
          checkoutRequestID: mpesaResponse.CheckoutRequestID,
        } as any,
      },
    });

    return {
      subscriptionId: subscription.id,
      paymentRequired: true,
      checkoutUrl: mpesaResponse.CheckoutRequestID,
    };
  } catch (error) {
    console.error('M-Pesa payment initiation failed:', error);
    throw new Error('Failed to initiate payment');
  }
};

/**
 * Confirm subscription payment (M-Pesa callback)
 */
export const confirmSubscriptionPayment = async (
  subscriptionId: string,
  transactionId: string
): Promise<void> => {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Update subscription to ACTIVE
  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'ACTIVE',
      lastPaymentId: transactionId,
    },
  });

  // Activate subscription
  await activateSubscription(subscriptionId);
};

/**
 * Activate subscription and update lawyer profile
 */
async function activateSubscription(subscriptionId: string): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  const tierLimits = TIER_LIMITS[subscription.tier];

  // Update lawyer profile with new tier and limits
  await prisma.lawyerProfile.update({
    where: { userId: subscription.lawyerId },
    data: {
      tier: subscription.tier,
      maxSpecializations: tierLimits.maxSpecializations,
      maxServicesPerMonth: tierLimits.maxServicesPerMonth,
      maxBookingsPerMonth: tierLimits.maxBookingsPerMonth,
      maxCertificationsPerMonth: tierLimits.maxCertificationsPerMonth,
      // Reset usage counters on tier upgrade
      monthlyBookings: 0,
      monthlyCertifications: 0,
      monthlyServices: 0,
      usageResetAt: subscription.currentPeriodEnd,
    },
  });

  // Cancel any previous active subscriptions
  await prisma.subscription.updateMany({
    where: {
      lawyerId: subscription.lawyerId,
      status: 'ACTIVE',
      id: { not: subscriptionId },
    },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });
}

/**
 * Cancel subscription
 */
export const cancelSubscription = async (lawyerId: string): Promise<void> => {
  const activeSubscription = await prisma.subscription.findFirst({
    where: { lawyerId, status: 'ACTIVE' },
  });

  if (!activeSubscription) {
    throw new Error('No active subscription found');
  }

  // Set to cancel at end of current period
  await prisma.subscription.update({
    where: { id: activeSubscription.id },
    data: {
      cancelAt: activeSubscription.currentPeriodEnd,
    },
  });

  // Will downgrade to FREE at end of period
};

/**
 * Process subscription renewals (run daily via cron)
 */
export const processSubscriptionRenewals = async (): Promise<void> => {
  const now = new Date();

  // Find subscriptions that need renewal
  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      status: 'ACTIVE',
      nextBillingDate: { lte: now },
      tier: { in: [LawyerTier.LITE, LawyerTier.PRO] }, // Only paid tiers
    },
    include: {
      lawyer: true,
    },
  });

  for (const subscription of dueSubscriptions) {
    try {
      // Check if subscription is set to cancel
      if (subscription.cancelAt && subscription.cancelAt <= now) {
        await downgradeToFree(subscription.lawyerId);
        continue;
      }

      // Attempt renewal payment
      const phoneNumber = subscription.lawyer.phoneNumber;
      if (!phoneNumber) {
        console.error(`No phone number for lawyer ${subscription.lawyerId}`);
        continue;
      }

      const mpesaResponse = await mpesaService.initiateSTKPush({
        phoneNumber,
        amount: subscription.monthlyFee,
        accountReference: `RENEW-${subscription.id.substring(0, 8)}`,
        transactionDesc: `Wakili Pro ${subscription.tier} Renewal`,
      });

      // Store M-Pesa request IDs in subscription metadata
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          metadata: {
            merchantRequestID: mpesaResponse.MerchantRequestID,
            checkoutRequestID: mpesaResponse.CheckoutRequestID,
          } as any,
        },
      });

      // Update next billing date
      const nextBillingDate = new Date(now);
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          currentPeriodStart: now,
          currentPeriodEnd: nextBillingDate,
          nextBillingDate,
        },
      });
    } catch (error) {
      console.error(`Failed to renew subscription ${subscription.id}:`, error);
      // Send notification to lawyer about failed renewal
    }
  }
};

/**
 * Downgrade lawyer to FREE tier
 */
async function downgradeToFree(lawyerId: string): Promise<void> {
  const lawyer = await prisma.lawyerProfile.findUnique({
    where: { userId: lawyerId },
  });

  if (!lawyer) return;

  const tierLimits = TIER_LIMITS.FREE;

  await prisma.lawyerProfile.update({
    where: { userId: lawyerId },
    data: {
      tier: LawyerTier.FREE,
      maxSpecializations: tierLimits.maxSpecializations,
      maxServicesPerMonth: tierLimits.maxServicesPerMonth,
      maxBookingsPerMonth: tierLimits.maxBookingsPerMonth,
      maxCertificationsPerMonth: tierLimits.maxCertificationsPerMonth,
      acceptingCertifications: false, // FREE tier cannot certify
    },
  });

  await prisma.subscription.updateMany({
    where: { lawyerId, status: 'ACTIVE' },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
    },
  });

  // Create FREE subscription record
  const now = new Date();
  const currentPeriodEnd = new Date(now);
  currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);

  await prisma.subscription.create({
    data: {
      lawyerId,
      tier: LawyerTier.FREE,
      status: 'ACTIVE',
      currentPeriodStart: now,
      currentPeriodEnd,
      monthlyFee: 0,
      paymentMethod: 'MPESA',
      downgradesFrom: lawyer.tier,
    },
  });
}

/**
 * Get tier comparison data
 */
export const getTierComparison = () => {
  return {
    FREE: {
      monthlyFee: 0,
      features: {
        specializations: 1,
        servicesPerMonth: 1,
        bookingsPerMonth: 2,
        certificationsPerMonth: 0,
        platformCommission: '50%',
        earlyAccess: false,
        letterhead: false,
        prioritySupport: false,
      },
      limits: TIER_LIMITS.FREE,
    },
    LITE: {
      monthlyFee: 1999,
      features: {
        specializations: 2,
        servicesPerMonth: 5,
        bookingsPerMonth: 10,
        certificationsPerMonth: 5,
        platformCommission: '30%',
        earlyAccess: false,
        letterhead: false,
        prioritySupport: false,
      },
      limits: TIER_LIMITS.LITE,
      breakEven: 'Just 2 bookings/month',
    },
    PRO: {
      monthlyFee: 4999,
      features: {
        specializations: 'Unlimited',
        servicesPerMonth: 'Unlimited',
        bookingsPerMonth: 'Unlimited',
        certificationsPerMonth: 'Unlimited',
        platformCommission: '15-30%',
        earlyAccess: true,
        letterhead: true,
        prioritySupport: true,
      },
      limits: TIER_LIMITS.PRO,
      breakEven: 'KES 33,000 monthly GMV',
    },
  };
};

/**
 * Helper to compare tier levels
 */
function getTierLevel(tier: LawyerTier): number {
  const levels = { FREE: 0, LITE: 1, PRO: 2 };
  return levels[tier];
}

export default {
  createSubscription,
  confirmSubscriptionPayment,
  cancelSubscription,
  processSubscriptionRenewals,
  getTierComparison,
};
