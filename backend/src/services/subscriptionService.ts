import { PrismaClient, LawyerTier, SubscriptionStatus, SubscriptionPlan } from '@prisma/client';
import { mpesaService } from './mpesaDarajaService';

const prisma = new PrismaClient();

const SUBSCRIPTION_FEES = {
  FREE: 0,
  LITE: 2999, // KES per month
  PRO: 4999,  // KES per month
};

// Billing cycle discounts
const BILLING_CYCLE_DISCOUNTS = {
  monthly: 0,
  '3months': 0.10,  // 10% discount
  '6months': 0.15,  // 15% discount
  yearly: 0.20      // 20% discount
};

type BillingCycle = 'monthly' | '3months' | '6months' | 'yearly';

const getBillingCycleDuration = (cycle: BillingCycle): number => {
  switch (cycle) {
    case 'monthly': return 1;
    case '3months': return 3;
    case '6months': return 6;
    case 'yearly': return 12;
  }
};

const calculateSubscriptionAmount = (tier: LawyerTier, billingCycle: BillingCycle = 'monthly'): number => {
  const baseFee = SUBSCRIPTION_FEES[tier];
  if (baseFee === 0) return 0;
  
  const discount = BILLING_CYCLE_DISCOUNTS[billingCycle];
  const monthlyFee = baseFee * (1 - discount);
  const duration = getBillingCycleDuration(billingCycle);
  
  return Math.round(monthlyFee * duration);
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
  userId: string,
  targetTier: LawyerTier,
  billingCycle: BillingCycle = 'monthly'
): Promise<{ subscriptionId: string; paymentRequired: boolean; checkoutUrl?: string }> => {
  const lawyer = await prisma.lawyerProfile.findUnique({
    where: { userId },
    include: { subscriptions: { where: { status: 'ACTIVE' } } },
  });

  if (!lawyer) {
    throw new Error('Lawyer profile not found');
  }

  // Check if downgrade
  const currentTier = lawyer.tier;
  const isDowngrade = getTierLevel(targetTier) < getTierLevel(currentTier || 'FREE');

  if (isDowngrade) {
    throw new Error('Downgrades must be handled separately');
  }

  // Calculate billing dates
  const now = new Date();
  const duration = getBillingCycleDuration(billingCycle);
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + duration);

  const totalAmount = calculateSubscriptionAmount(targetTier, billingCycle);
  
  // Map billingCycle to SubscriptionPlan
  const plan: SubscriptionPlan = billingCycle === 'yearly' || billingCycle === '6months' || billingCycle === '3months' ? 'YEARLY' : 'MONTHLY';

  // Create subscription using actual schema fields only
  const subscription = await prisma.lawyerSubscription.create({
    data: {
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      lawyerProfileId: lawyer.id,
      plan,
      status: totalAmount === 0 ? 'ACTIVE' : 'PENDING',
      priceKES: totalAmount,
      startDate: now,
      endDate,
      updatedAt: now,
      paymentInfo: {
        billingCycle,
        baseFee: SUBSCRIPTION_FEES[targetTier],
        discount: BILLING_CYCLE_DISCOUNTS[billingCycle] * 100,
        totalAmount,
        duration,
        tier: targetTier
      },
    },
  });

  // If FREE tier, activate immediately
  if (totalAmount === 0) {
    await activateSubscription(subscription.id);
    return { subscriptionId: subscription.id, paymentRequired: false };
  }

  // Initiate M-Pesa payment
  const phoneNumber = lawyer.phoneNumber;
  if (!phoneNumber) {
    throw new Error('Phone number required for M-Pesa payment');
  }

  const cycleName = billingCycle === 'monthly' ? '1 Month' : 
                     billingCycle === '3months' ? '3 Months' : 
                     billingCycle === '6months' ? '6 Months' : '12 Months';

  try {
    const mpesaResponse = await mpesaService.initiateSTKPush({
      phoneNumber,
      amount: totalAmount,
      accountReference: `SUB-${subscription.id.substring(0, 8)}`,
      transactionDesc: `Wakili Pro ${targetTier} - ${cycleName}`,
    });

    // Store M-Pesa request IDs in subscription paymentInfo
    await prisma.lawyerSubscription.update({
      where: { id: subscription.id },
      data: {
        paymentInfo: {
          ...subscription.paymentInfo as any,
          merchantRequestID: mpesaResponse.MerchantRequestID,
          checkoutRequestID: mpesaResponse.CheckoutRequestID,
        },
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
  const subscription = await prisma.lawyerSubscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Update subscription to ACTIVE
  await prisma.lawyerSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: 'ACTIVE',
      paymentInfo: {
        ...subscription.paymentInfo as any,
        lastPaymentId: transactionId
      }
    },
  });

  // Activate subscription
  await activateSubscription(subscriptionId);
};

/**
 * Activate subscription and update lawyer profile
 */
async function activateSubscription(subscriptionId: string): Promise<void> {
  const subscription = await prisma.lawyerSubscription.findUnique({
    where: { id: subscriptionId },
    include: { lawyerProfile: true }
  });

  if (!subscription || !subscription.lawyerProfile) {
    throw new Error('Subscription not found');
  }

  // Map SubscriptionPlan to LawyerTier
  const tierMap: Record<string, LawyerTier> = {
    'LITE': 'LITE' as LawyerTier,
    'PRO': 'PRO' as LawyerTier
  };
  const tier = tierMap[subscription.plan] || 'FREE' as LawyerTier;
  const tierLimits = TIER_LIMITS[tier];

  // Update lawyer profile with new tier
  await prisma.lawyerProfile.update({
    where: { id: subscription.lawyerProfileId! },
    data: {
      tier,
      maxSpecializations: tierLimits.maxSpecializations
    },
  });

  // Cancel any previous active subscriptions
  await prisma.lawyerSubscription.updateMany({
    where: {
      userId: subscription.userId,
      status: 'ACTIVE',
      id: { not: subscriptionId },
    },
    data: {
      status: 'CANCELLED',
    },
  });
}

/**
 * Cancel subscription
 */
export const cancelSubscription = async (userId: string): Promise<void> => {
  const activeSubscription = await prisma.lawyerSubscription.findFirst({
    where: { userId, status: 'ACTIVE' },
  });

  if (!activeSubscription) {
    throw new Error('No active subscription found');
  }

  // Mark as cancelled (will downgrade to FREE at end of period)
  await prisma.lawyerSubscription.update({
    where: { id: activeSubscription.id },
    data: {
      status: 'CANCELLED'
    },
  });

  // Downgrade to FREE immediately
  await downgradeToFree(userId);
};

/**
 * Process subscription renewals (run daily via cron)
 */
export const processSubscriptionRenewals = async (): Promise<void> => {
  const now = new Date();

  // Find subscriptions that need renewal (ended)
  const dueSubscriptions = await prisma.lawyerSubscription.findMany({
    where: {
      status: 'ACTIVE',
      endDate: { lte: now },
    },
    include: {
      lawyerProfile: true,
      User: true
    },
  });

  for (const subscription of dueSubscriptions) {
    try {
      const phoneNumber = subscription.lawyerProfile?.phoneNumber;
      if (!phoneNumber) {
        console.error(`No phone number for user ${subscription.userId}`);
        continue;
      }

      const mpesaResponse = await mpesaService.initiateSTKPush({
        phoneNumber,
        amount: subscription.priceKES,
        accountReference: `RENEW-${subscription.id.substring(0, 8)}`,
        transactionDesc: `Wakili Pro ${subscription.plan} Renewal`,
      });

      // Store M-Pesa request IDs in subscription paymentInfo
      await prisma.lawyerSubscription.update({
        where: { id: subscription.id },
        data: {
          paymentInfo: {
            ...subscription.paymentInfo as any,
            merchantRequestID: mpesaResponse.MerchantRequestID,
            checkoutRequestID: mpesaResponse.CheckoutRequestID,
          },
        },
      });

      // Update renewal dates
      const newEndDate = new Date(now);
      newEndDate.setMonth(newEndDate.getMonth() + 1);

      await prisma.lawyerSubscription.update({
        where: { id: subscription.id },
        data: {
          startDate: now,
          endDate: newEndDate,
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
async function downgradeToFree(userId: string): Promise<void> {
  const lawyer = await prisma.lawyerProfile.findUnique({
    where: { userId },
  });

  if (!lawyer) return;

  const tierLimits = TIER_LIMITS.FREE;

  await prisma.lawyerProfile.update({
    where: { userId },
    data: {
      tier: LawyerTier.FREE,
      maxSpecializations: tierLimits.maxSpecializations
    },
  });

  await prisma.lawyerSubscription.updateMany({
    where: { userId, status: 'ACTIVE' },
    data: {
      status: 'CANCELLED',
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
function getTierLevel(tier: LawyerTier | string): number {
  const levels: Record<string, number> = { FREE: 0, LITE: 1, PRO: 2 };
  return levels[tier] || 0;
}

export default {
  createSubscription,
  confirmSubscriptionPayment,
  cancelSubscription,
  processSubscriptionRenewals,
  getTierComparison,
};
