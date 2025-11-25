interface ServiceFeeData {
  transactionValue?: number;
  dealValue?: number;
  claimAmount?: number;
  businessType?: string;
  complexity?: string;
}

interface FeeCalculation {
  estimatedFee: number;
  tier: string;
  breakdown: string;
}

/**
 * Calculate service fee based on category and input data
 * Shared logic between frontend (estimate) and backend (validation)
 */
export const calculateServiceFee = (
  category: string,
  data: ServiceFeeData
): FeeCalculation => {
  let estimatedFee = 0;
  let breakdown = '';

  switch (category) {
    case 'Property Transfer':
      if (data.transactionValue) {
        const percentage = 0.015; // 1.5%
        estimatedFee = Math.max(data.transactionValue * percentage, 50000);
        breakdown = `${(percentage * 100).toFixed(1)}% of transaction value (min KES 50,000)`;
      }
      break;

    case 'Business Acquisition':
      if (data.dealValue) {
        const percentage = 0.02; // 2%
        estimatedFee = Math.max(data.dealValue * percentage, 200000);
        breakdown = `${(percentage * 100).toFixed(1)}% of deal value (min KES 200,000)`;
      }
      break;

    case 'Debt Collection':
      if (data.claimAmount) {
        const percentage = 0.25; // 25% success fee
        estimatedFee = Math.max(data.claimAmount * percentage, 100000);
        breakdown = `${(percentage * 100).toFixed(0)}% success fee (min KES 100,000)`;
      }
      break;

    case 'Business Registration':
      if (data.businessType === 'Sole Proprietorship') {
        estimatedFee = 20000;
        breakdown = 'Fixed fee for sole proprietorship';
      } else if (data.businessType === 'Partnership') {
        estimatedFee = 50000;
        breakdown = 'Fixed fee for partnership';
      } else if (data.businessType === 'Limited Company') {
        estimatedFee = 100000;
        breakdown = 'Fixed fee for limited company';
      }
      break;

    case 'Will Drafting':
      if (data.complexity === 'Simple') {
        estimatedFee = 5000;
        breakdown = 'Fixed fee for simple will';
      } else if (data.complexity === 'Standard') {
        estimatedFee = 15000;
        breakdown = 'Fixed fee for standard will';
      } else if (data.complexity === 'Complex') {
        estimatedFee = 35000;
        breakdown = 'Fixed fee for complex will with trusts';
      }
      break;

    default:
      estimatedFee = 0;
      breakdown = 'Custom pricing - submit for quote';
  }

  // Determine tier based on fee
  // tier1 (< 100K): LITE + PRO can access, connection fee KES 2,000
  // tier2 (>= 100K): PRO only, connection fee KES 5,000
  const tier = estimatedFee >= 100000 ? 'tier2' : 'tier1';

  return {
    estimatedFee,
    tier,
    breakdown
  };
};
