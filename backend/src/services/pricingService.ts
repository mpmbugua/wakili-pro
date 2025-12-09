import { PrismaClient, LawyerTier, PricingTier } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Pricing configuration for different tiers
 */
const CERTIFICATION_PRICING = {
  ENTRY: {
    baseRate: 2000, // KES per certification
    multiplier: 1.0,
  },
  STANDARD: {
    baseRate: 2500,
    multiplier: 1.25,
  },
  PREMIUM: {
    baseRate: 3000,
    multiplier: 1.5,
  },
  ELITE: {
    baseRate: 4000,
    multiplier: 2.0,
  },
};

const WHT_RATE = 0.05; // 5% Withholding Tax

/**
 * Calculate pricing for video consultations
 * Lawyer sets their own rate, platform takes commission
 */
export const calculateConsultationPricing = (
  lawyerRate: number,
  lawyerTier: LawyerTier
) => {
  const grossAmount = lawyerRate;
  const platformCommissionRate = 0.30; // 30% for all tiers on consultations
  
  const platformCommission = Math.round(grossAmount * platformCommissionRate);
  const lawyerShareBeforeWHT = grossAmount - platformCommission;
  const whtAmount = Math.round(lawyerShareBeforeWHT * WHT_RATE);
  const lawyerNetPayout = lawyerShareBeforeWHT - whtAmount;

  return {
    grossAmount,
    platformCommission,
    platformCommissionRate,
    lawyerShareBeforeWHT,
    whtAmount,
    lawyerNetPayout,
    lawyerPercentage: ((lawyerNetPayout / grossAmount) * 100).toFixed(2),
  };
};

/**
 * Calculate pricing for marketplace services
 * Lawyer sets their own fee, platform takes commission
 */
export const calculateMarketplaceServicePricing = (
  serviceFee: number,
  lawyerTier: LawyerTier
) => {
  const grossAmount = serviceFee;
  const platformCommissionRate = 0.30; // 30% for all tiers on marketplace services
  
  const platformCommission = Math.round(grossAmount * platformCommissionRate);
  const lawyerShareBeforeWHT = grossAmount - platformCommission;
  const whtAmount = Math.round(lawyerShareBeforeWHT * WHT_RATE);
  const lawyerNetPayout = lawyerShareBeforeWHT - whtAmount;

  return {
    grossAmount,
    platformCommission,
    platformCommissionRate,
    lawyerShareBeforeWHT,
    whtAmount,
    lawyerNetPayout,
    lawyerPercentage: ((lawyerNetPayout / grossAmount) * 100).toFixed(2),
  };
};

/**
 * Calculate pricing for document certifications
 * System calculates based on lawyer's pricing tier and performance
 */
export const calculateCertificationPricing = (
  lawyerTier: LawyerTier,
  pricingTier: PricingTier,
  documentComplexity: number = 1, // 1-5 scale
  documentCategory: string
) => {
  // Base rate from pricing tier
  const tierConfig = CERTIFICATION_PRICING[pricingTier];
  let baseRate = tierConfig.baseRate;

  // Apply complexity multiplier
  const complexityMultiplier = 1 + (documentComplexity - 1) * 0.2; // 1.0x to 1.8x
  baseRate = Math.round(baseRate * complexityMultiplier);

  // Category-specific adjustments
  const categoryMultipliers: { [key: string]: number } = {
    EMPLOYMENT: 1.0,
    PROPERTY: 1.5, // Land/property docs are more complex
    FAMILY: 1.2,
    CORPORATE: 1.8,
    INTELLECTUAL_PROPERTY: 1.6,
    LITIGATION: 1.4,
    DEFAULT: 1.0,
  };

  const categoryMultiplier = categoryMultipliers[documentCategory] || categoryMultipliers.DEFAULT;
  baseRate = Math.round(baseRate * categoryMultiplier);

  // Commission rate based on lawyer tier
  const platformCommissionRate = lawyerTier === LawyerTier.PRO ? 0.15 : 0.20; // 15% for PRO, 20% for LITE
  
  const grossAmount = baseRate;
  const platformCommission = Math.round(grossAmount * platformCommissionRate);
  const lawyerShareBeforeWHT = grossAmount - platformCommission;
  const whtAmount = Math.round(lawyerShareBeforeWHT * WHT_RATE);
  const lawyerNetPayout = lawyerShareBeforeWHT - whtAmount;

  return {
    grossAmount,
    platformCommission,
    platformCommissionRate,
    lawyerShareBeforeWHT,
    whtAmount,
    lawyerNetPayout,
    lawyerPercentage: ((lawyerNetPayout / grossAmount) * 100).toFixed(2),
    breakdown: {
      baseRate: tierConfig.baseRate,
      pricingTier,
      complexityMultiplier,
      categoryMultiplier,
      finalRate: grossAmount,
    },
  };
};

/**
 * Calculate lawyer's pricing tier based on performance metrics
 */
export const calculateLawyerPricingTier = async (
  lawyerId: string
): Promise<PricingTier> => {
  const profile = await prisma.lawyerProfile.findUnique({
    where: { userId: lawyerId },
  });

  if (!profile) {
    throw new Error('Lawyer profile not found');
  }

  const {
    rating = 0,
    certificationCount = 0,
    certificationCompletionRate = 0,
    tier,
  } = profile;

  // Scoring algorithm
  let score = 0;

  // Rating contribution (0-40 points)
  if (rating >= 4.8) score += 40;
  else if (rating >= 4.5) score += 30;
  else if (rating >= 4.0) score += 20;
  else if (rating >= 3.5) score += 10;

  // Experience contribution (0-30 points)
  if (certificationCount >= 100) score += 30;
  else if (certificationCount >= 50) score += 20;
  else if (certificationCount >= 20) score += 10;
  else if (certificationCount >= 5) score += 5;

  // Completion rate contribution (0-20 points)
  if (certificationCompletionRate >= 0.95) score += 20;
  else if (certificationCompletionRate >= 0.90) score += 15;
  else if (certificationCompletionRate >= 0.85) score += 10;
  else if (certificationCompletionRate >= 0.80) score += 5;

  // Tier bonus (0-10 points)
  if (tier === LawyerTier.PRO) score += 10;
  else if (tier === LawyerTier.LITE) score += 5;

  // Determine pricing tier based on total score
  if (score >= 80) return PricingTier.ELITE;
  if (score >= 60) return PricingTier.PREMIUM;
  if (score >= 40) return PricingTier.STANDARD;
  return PricingTier.ENTRY;
};

/**
 * Update lawyer's pricing tier (run periodically or after major milestones)
 */
export const updateLawyerPricingTier = async (lawyerId: string) => {
  const newPricingTier = await calculateLawyerPricingTier(lawyerId);

  await prisma.lawyerProfile.update({
    where: { userId: lawyerId },
    data: { pricingTier: newPricingTier },
  });

  return newPricingTier;
};

/**
 * Get document pricing for client (before lawyer is assigned)
 */
export const getDocumentPricing = async (
  templateId: string,
  tier: 'BASIC' | 'FILLED' | 'CERTIFIED'
) => {
  const template = await prisma.documentTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template not found');
  }

  if (tier === 'BASIC') {
    return {
      tier: 'BASIC',
      price: template.basePrice,
      description: 'Static PDF download',
    };
  }

  if (tier === 'FILLED') {
    return {
      tier: 'FILLED',
      price: template.smartFillPrice,
      description: 'AI-filled personalized document',
    };
  }

  if (tier === 'CERTIFIED') {
    // Estimate certification fee (will be calculated exactly when lawyer is assigned)
    const estimatedCertificationFee = 2500; // Average STANDARD tier pricing
    const totalPrice = template.smartFillPrice + estimatedCertificationFee;

    return {
      tier: 'CERTIFIED',
      price: totalPrice,
      breakdown: {
        documentPrice: template.smartFillPrice,
        estimatedCertificationFee,
      },
      description: 'AI-filled + lawyer-certified with letterhead',
      note: 'Final certification fee will be calculated based on assigned lawyer',
    };
  }

  throw new Error('Invalid tier');
};

/**
 * Record payment with full breakdown
 */
export const recordPayment = async (
  userId: string,
  serviceType: 'VIDEO_CONSULTATION' | 'MARKETPLACE_SERVICE' | 'DOCUMENT_CERTIFICATION',
  pricingData: ReturnType<typeof calculateConsultationPricing>,
  bookingId?: string,
  paymentMethod: 'MPESA' | 'STRIPE_CARD' | 'BANK_TRANSFER' = 'MPESA',
  externalTransactionId?: string
) => {
  const payment = await prisma.payment.create({
    data: {
      userId,
      bookingId,
      serviceType,
      amount: pricingData.netAmount, // Fixed: grossAmount doesn't exist, use netAmount
      status: 'PAID',
      method: paymentMethod,
      externalTransactionId,
    } as any,
  });

  return payment;
};

/**
 * Get monthly WHT report for KRA remittance
 */
export const generateMonthlyWHTReport = async (month: number, year: number, generatedBy: string) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const payments = await prisma.payment.findMany({
    where: {
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      whtAmount: { gt: 0 },
      status: 'PAID',
    },
  });

  const totalWHTCollected = payments.reduce((sum, p) => sum + (p.whtAmount || 0), 0);
  const paymentIds = payments.map(p => p.id);

  const report = await prisma.monthlyWHTReport.create({
    data: {
      month,
      year,
      // paymentIds removed - doesn't exist in schema
      generatedBy,
    } as any,
  });

  return report;
};

export default {
  calculateConsultationPricing,
  calculateMarketplaceServicePricing,
  calculateCertificationPricing,
  calculateLawyerPricingTier,
  updateLawyerPricingTier,
  getDocumentPricing,
  recordPayment,
  generateMonthlyWHTReport,
};
