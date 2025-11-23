import { Request, Response, NextFunction } from 'express';
import { PrismaClient, LawyerTier } from '@prisma/client';

const prisma = new PrismaClient();

// Tier limits configuration
const TIER_LIMITS = {
  FREE: {
    maxSpecializations: 1,
    maxServicesPerMonth: 1,
    maxBookingsPerMonth: 2,
    maxCertificationsPerMonth: 0,
    commissionRate: 0.50, // 50% platform commission
  },
  LITE: {
    maxSpecializations: 2,
    maxServicesPerMonth: 5,
    maxBookingsPerMonth: 10,
    maxCertificationsPerMonth: 5,
    commissionRate: 0.30, // 30% platform commission
  },
  PRO: {
    maxSpecializations: Infinity,
    maxServicesPerMonth: Infinity,
    maxBookingsPerMonth: Infinity,
    maxCertificationsPerMonth: Infinity,
    commissionRate: 0.15, // 15% platform commission on certifications, 30% on others
  },
};

/**
 * Extend Express Request to include lawyer profile
 */
interface AuthRequest extends Request {
  user?: {
    userId: string;
    role: string;
  };
  lawyerProfile?: any;
}

/**
 * Middleware to load lawyer profile into request
 */
export const loadLawyerProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await prisma.lawyerProfile.findUnique({
      where: { userId: req.user.userId },
      include: { subscriptions: { where: { status: 'ACTIVE' } } },
    });

    if (!profile) {
      return res.status(404).json({ error: 'Lawyer profile not found' });
    }

    // Reset monthly counters if usage period has expired
    const now = new Date();
    if (profile.usageResetAt && profile.usageResetAt < now) {
      const nextReset = new Date(now);
      nextReset.setMonth(nextReset.getMonth() + 1);

      await prisma.lawyerProfile.update({
        where: { id: profile.id },
        data: {
          monthlyBookings: 0,
          monthlyCertifications: 0,
          monthlyServices: 0,
          usageResetAt: nextReset,
        },
      });

      profile.monthlyBookings = 0;
      profile.monthlyCertifications = 0;
      profile.monthlyServices = 0;
    }

    req.lawyerProfile = profile;
    next();
  } catch (error) {
    console.error('Error loading lawyer profile:', error);
    res.status(500).json({ error: 'Failed to load lawyer profile' });
  }
};

/**
 * Require PRO tier to access a feature
 */
export const requireProTier = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const profile = req.lawyerProfile;

  if (!profile) {
    return res.status(403).json({ error: 'Lawyer profile required' });
  }

  if (profile.tier !== LawyerTier.PRO) {
    return res.status(403).json({
      error: 'This feature requires PRO tier',
      upgradeUrl: '/api/subscriptions/upgrade',
      currentTier: profile.tier,
      requiredTier: 'PRO',
    });
  }

  next();
};

/**
 * Require LITE or PRO tier (block FREE tier)
 */
export const requirePaidTier = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const profile = req.lawyerProfile;

  if (!profile) {
    return res.status(403).json({ error: 'Lawyer profile required' });
  }

  if (profile.tier === LawyerTier.FREE) {
    return res.status(403).json({
      error: 'This feature requires a paid subscription',
      upgradeUrl: '/api/subscriptions/upgrade',
      currentTier: profile.tier,
      recommendedTier: 'LITE',
    });
  }

  next();
};

/**
 * Check if lawyer has exceeded booking limit for their tier
 */
export const checkBookingLimit = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const profile = req.lawyerProfile;

  if (!profile) {
    return res.status(403).json({ error: 'Lawyer profile required' });
  }

  const limits = TIER_LIMITS[profile.tier];
  const currentBookings = profile.monthlyBookings || 0;

  if (currentBookings >= limits.maxBookingsPerMonth) {
    return res.status(403).json({
      error: `Monthly booking limit reached for ${profile.tier} tier`,
      limit: limits.maxBookingsPerMonth,
      current: currentBookings,
      upgradeUrl: '/api/subscriptions/upgrade',
      nextTier: profile.tier === LawyerTier.FREE ? 'LITE' : 'PRO',
    });
  }

  next();
};

/**
 * Check if lawyer has exceeded specialization limit for their tier
 */
export const checkSpecializationLimit = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const profile = req.lawyerProfile;

  if (!profile) {
    return res.status(403).json({ error: 'Lawyer profile required' });
  }

  const limits = TIER_LIMITS[profile.tier];
  const currentSpecializations = profile.specializations?.length || 0;

  // Get the new specialization count from request body
  const newSpecializations = req.body.specializations;
  const newCount = newSpecializations?.length || 0;

  if (newCount > limits.maxSpecializations) {
    return res.status(403).json({
      error: `Specialization limit exceeded for ${profile.tier} tier`,
      limit: limits.maxSpecializations,
      requested: newCount,
      upgradeUrl: '/api/subscriptions/upgrade',
      nextTier: profile.tier === LawyerTier.FREE ? 'LITE' : 'PRO',
    });
  }

  next();
};

/**
 * Check if lawyer has exceeded certification limit for their tier
 */
export const checkCertificationLimit = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const profile = req.lawyerProfile;

  if (!profile) {
    return res.status(403).json({ error: 'Lawyer profile required' });
  }

  const limits = TIER_LIMITS[profile.tier];
  const currentCertifications = profile.monthlyCertifications || 0;

  // FREE tier cannot accept certifications
  if (profile.tier === LawyerTier.FREE) {
    return res.status(403).json({
      error: 'Document certification is not available on FREE tier',
      upgradeUrl: '/api/subscriptions/upgrade',
      minimumTier: 'LITE',
    });
  }

  if (currentCertifications >= limits.maxCertificationsPerMonth) {
    return res.status(403).json({
      error: `Monthly certification limit reached for ${profile.tier} tier`,
      limit: limits.maxCertificationsPerMonth,
      current: currentCertifications,
      upgradeUrl: '/api/subscriptions/upgrade',
      nextTier: 'PRO',
    });
  }

  next();
};

/**
 * Check if lawyer has exceeded marketplace service limit for their tier
 */
export const checkServiceLimit = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const profile = req.lawyerProfile;

  if (!profile) {
    return res.status(403).json({ error: 'Lawyer profile required' });
  }

  const limits = TIER_LIMITS[profile.tier];
  const currentServices = profile.monthlyServices || 0;

  if (currentServices >= limits.maxServicesPerMonth) {
    return res.status(403).json({
      error: `Monthly service limit reached for ${profile.tier} tier`,
      limit: limits.maxServicesPerMonth,
      current: currentServices,
      upgradeUrl: '/api/subscriptions/upgrade',
      nextTier: profile.tier === LawyerTier.FREE ? 'LITE' : 'PRO',
    });
  }

  next();
};

/**
 * Get commission rate for a lawyer based on their tier and service type
 */
export const getCommissionRate = (
  tier: LawyerTier,
  serviceType: 'VIDEO_CONSULTATION' | 'MARKETPLACE_SERVICE' | 'DOCUMENT_CERTIFICATION'
): number => {
  if (serviceType === 'DOCUMENT_CERTIFICATION' && tier === LawyerTier.PRO) {
    return 0.15; // PRO lawyers get 15% commission on certifications
  }
  
  return TIER_LIMITS[tier].commissionRate;
};

/**
 * Increment usage counter after successful action
 */
export const incrementUsageCounter = async (
  lawyerId: string,
  counterType: 'bookings' | 'certifications' | 'services'
) => {
  const fieldMap = {
    bookings: 'monthlyBookings',
    certifications: 'monthlyCertifications',
    services: 'monthlyServices',
  };

  await prisma.lawyerProfile.update({
    where: { userId: lawyerId },
    data: {
      [fieldMap[counterType]]: { increment: 1 },
    },
  });
};

export { TIER_LIMITS };
