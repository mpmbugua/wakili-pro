import { ReviewType, UrgencyLevel } from '@prisma/client';

interface PricingCalculation {
  basePrice: number;
  urgencyMultiplier: number;
  urgencySurcharge: number;
  subtotal: number;
  platformFee: number;
  total: number;
  lawyerEarnings: number;
  estimatedDelivery: {
    min: number; // hours
    max: number; // hours
  };
}

/**
 * Base pricing for each service tier (in USD)
 */
const SERVICE_PRICING = {
  AI_ONLY: {
    price: 5.00,
    estimatedHours: { min: 2, max: 4 },
    lawyerShare: 0 // No lawyer for AI-only
  },
  CERTIFICATION: {
    price: 15.00,
    estimatedHours: { min: 24, max: 48 },
    lawyerShare: 0.75 // Lawyer gets 75%
  },
  AI_PLUS_CERTIFICATION: {
    price: 18.00,
    estimatedHours: { min: 24, max: 48 },
    lawyerShare: 0.75
  }
} as const;

/**
 * Urgency level multipliers and time reduction
 */
const URGENCY_PRICING = {
  STANDARD: {
    multiplier: 1.0,
    timeReduction: 1.0 // No reduction
  },
  NORMAL: {
    multiplier: 1.0,
    timeReduction: 1.0
  },
  LOW: {
    multiplier: 0.9,
    timeReduction: 1.2 // 20% slower, cheaper
  },
  MEDIUM: {
    multiplier: 1.3,
    timeReduction: 0.7 // 30% faster
  },
  HIGH: {
    multiplier: 1.5,
    timeReduction: 0.5 // 50% faster
  },
  URGENT: {
    multiplier: 1.5,
    timeReduction: 0.5
  },
  EMERGENCY: {
    multiplier: 2.0,
    timeReduction: 0.33 // 3x faster
  }
} as const;

/**
 * Platform fee configuration
 */
const PLATFORM_FEE_PERCENTAGE = 0.15; // 15% platform fee

/**
 * Calculate pricing for a document review request
 */
export function calculateDocumentReviewPricing(
  reviewType: ReviewType,
  urgencyLevel: UrgencyLevel = 'STANDARD'
): PricingCalculation {
  // Get base price
  const serviceConfig = SERVICE_PRICING[reviewType];
  if (!serviceConfig) {
    throw new Error(`Invalid review type: ${reviewType}`);
  }

  const basePrice = serviceConfig.price;

  // Get urgency multiplier
  const urgencyConfig = URGENCY_PRICING[urgencyLevel] || URGENCY_PRICING.STANDARD;
  const urgencyMultiplier = urgencyConfig.multiplier;
  const urgencySurcharge = basePrice * (urgencyMultiplier - 1);

  // Calculate subtotal
  const subtotal = basePrice * urgencyMultiplier;

  // Calculate platform fee
  const platformFee = subtotal * PLATFORM_FEE_PERCENTAGE;

  // Total user pays
  const total = subtotal;

  // Calculate lawyer earnings (subtotal - platform fee)
  const lawyerEarnings = (subtotal - platformFee) * serviceConfig.lawyerShare;

  // Calculate estimated delivery time
  const timeReduction = urgencyConfig.timeReduction;
  const estimatedDelivery = {
    min: Math.ceil(serviceConfig.estimatedHours.min * timeReduction),
    max: Math.ceil(serviceConfig.estimatedHours.max * timeReduction)
  };

  return {
    basePrice,
    urgencyMultiplier,
    urgencySurcharge,
    subtotal,
    platformFee,
    total,
    lawyerEarnings,
    estimatedDelivery
  };
}

/**
 * Get estimated delivery date based on urgency
 */
export function calculateDeliveryEstimate(
  reviewType: ReviewType,
  urgencyLevel: UrgencyLevel = 'STANDARD'
): { estimatedDate: Date; estimatedHours: number } {
  const pricing = calculateDocumentReviewPricing(reviewType, urgencyLevel);
  const avgHours = (pricing.estimatedDelivery.min + pricing.estimatedDelivery.max) / 2;
  
  const estimatedDate = new Date();
  estimatedDate.setHours(estimatedDate.getHours() + avgHours);

  return {
    estimatedDate,
    estimatedHours: avgHours
  };
}

/**
 * Validate pricing matches expected amount (for payment verification)
 */
export function validateDocumentReviewPricing(
  reviewType: ReviewType,
  urgencyLevel: UrgencyLevel,
  expectedAmount: number
): boolean {
  const pricing = calculateDocumentReviewPricing(reviewType, urgencyLevel);
  // Allow 1 cent tolerance for rounding
  return Math.abs(pricing.total - expectedAmount) < 0.01;
}

/**
 * Get pricing display for frontend
 */
export function getDocumentReviewPricingDisplay(
  reviewType: ReviewType,
  urgencyLevel: UrgencyLevel = 'STANDARD'
) {
  const pricing = calculateDocumentReviewPricing(reviewType, urgencyLevel);
  
  return {
    basePrice: `$${pricing.basePrice.toFixed(2)}`,
    urgencySurcharge: pricing.urgencySurcharge > 0 
      ? `+$${pricing.urgencySurcharge.toFixed(2)}` 
      : null,
    total: `$${pricing.total.toFixed(2)}`,
    estimatedTime: `${pricing.estimatedDelivery.min}-${pricing.estimatedDelivery.max} hours`,
    breakdown: {
      service: pricing.basePrice,
      urgency: pricing.urgencySurcharge,
      total: pricing.total
    }
  };
}

/**
 * Calculate lawyer payout for completed review
 */
export function calculateLawyerPayoutForReview(
  reviewType: ReviewType,
  urgencyLevel: UrgencyLevel,
  actualPrice: number
): number {
  const serviceConfig = SERVICE_PRICING[reviewType];
  if (!serviceConfig || serviceConfig.lawyerShare === 0) {
    return 0;
  }

  const platformFee = actualPrice * PLATFORM_FEE_PERCENTAGE;
  return (actualPrice - platformFee) * serviceConfig.lawyerShare;
}

/**
 * Get all available service tiers with pricing
 */
export function getAllDocumentReviewServiceTiers() {
  return Object.entries(SERVICE_PRICING).map(([type, config]) => ({
    type: type as ReviewType,
    name: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
    basePrice: config.price,
    estimatedHours: config.estimatedHours,
    pricing: {
      standard: calculateDocumentReviewPricing(type as ReviewType, 'STANDARD'),
      urgent: calculateDocumentReviewPricing(type as ReviewType, 'EXPRESS'), // Use EXPRESS instead of HIGH
      emergency: calculateDocumentReviewPricing(type as ReviewType, 'EXPRESS') // Map EMERGENCY to EXPRESS
    }
  }));
}
