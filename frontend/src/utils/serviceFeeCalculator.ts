/**
 * Service Fee Calculator
 * Calculates estimated legal fees based on service type and transaction details
 */

export interface ServiceFeeEstimate {
  estimatedFee: number;
  tier: 'tier1' | 'tier2';
  connectionFee: number;
  eligibleTiers: ('LITE' | 'PRO')[];
  calculation: string;
}

export interface ServiceRules {
  type: 'percentage' | 'fixed';
  percentageRate?: {
    min: number;
    max: number;
    basedOn: 'transactionValue' | 'dealValue' | 'claimAmount';
    minimumFee?: number;
  };
  fixedTiers?: Record<string, number>;
}

const SERVICE_RULES: Record<string, ServiceRules> = {
  'Property Transfer': {
    type: 'percentage',
    percentageRate: {
      min: 1.0,
      max: 2.0,
      basedOn: 'transactionValue',
      minimumFee: 50000
    }
  },
  'Business Acquisition': {
    type: 'percentage',
    percentageRate: {
      min: 1.5,
      max: 3.0,
      basedOn: 'dealValue',
      minimumFee: 200000
    }
  },
  'Debt Collection': {
    type: 'percentage',
    percentageRate: {
      min: 20,
      max: 30,
      basedOn: 'claimAmount',
      minimumFee: 50000
    }
  },
  'Business Registration': {
    type: 'fixed',
    fixedTiers: {
      'Sole Proprietor': 20000,
      'Partnership': 50000,
      'Limited Company': 100000,
      'NGO': 150000
    }
  },
  'Will Drafting': {
    type: 'fixed',
    fixedTiers: {
      'Simple Will': 5000,
      'Standard Will': 15000,
      'Complex Will with Trusts': 35000
    }
  },
  'Employment Contract': {
    type: 'fixed',
    fixedTiers: {
      'Simple': 10000,
      'Standard': 25000,
      'Executive': 50000
    }
  },
  'Divorce/Family Law': {
    type: 'fixed',
    fixedTiers: {
      'Uncontested': 50000,
      'Contested - No Children': 100000,
      'Contested - With Children': 150000
    }
  }
};

export const calculateServiceFee = (
  serviceCategory: string,
  formData: Record<string, any>
): ServiceFeeEstimate => {
  const rules = SERVICE_RULES[serviceCategory];
  
  if (!rules) {
    // Default estimate for uncategorized services
    return {
      estimatedFee: 50000,
      tier: 'tier1',
      connectionFee: 2000,
      eligibleTiers: ['LITE', 'PRO'],
      calculation: 'Default estimate'
    };
  }

  let estimatedFee = 0;
  let calculation = '';

  if (rules.type === 'percentage' && rules.percentageRate) {
    const baseValue = formData[rules.percentageRate.basedOn] || 0;
    const rate = formData.complexity === 'complex' 
      ? rules.percentageRate.max 
      : rules.percentageRate.min;
    
    estimatedFee = baseValue * (rate / 100);
    
    if (rules.percentageRate.minimumFee) {
      estimatedFee = Math.max(estimatedFee, rules.percentageRate.minimumFee);
    }
    
    calculation = `${rate}% of KES ${baseValue.toLocaleString()} = KES ${estimatedFee.toLocaleString()}`;
  }

  if (rules.type === 'fixed' && rules.fixedTiers) {
    const tierKey = formData.businessType || formData.complexity || formData.serviceType;
    estimatedFee = rules.fixedTiers[tierKey] || 50000;
    calculation = `Fixed fee for ${tierKey}`;
  }

  // Determine tier and connection fee
  const tier = estimatedFee >= 100000 ? 'tier2' : 'tier1';
  const connectionFee = tier === 'tier2' ? 5000 : 2000;
  const eligibleTiers = tier === 'tier2' ? ['PRO'] : ['LITE', 'PRO'];

  return {
    estimatedFee: Math.round(estimatedFee),
    tier,
    connectionFee,
    eligibleTiers,
    calculation
  };
};

export const getServiceFields = (serviceCategory: string) => {
  const fieldMappings: Record<string, any> = {
    'Property Transfer': [
      { name: 'transactionValue', label: 'Property sale/purchase value (KES)', type: 'number', required: true },
      { name: 'propertyLocation', label: 'Property location', type: 'text', required: true },
      { name: 'titleType', label: 'Title type', type: 'select', options: ['Freehold', 'Leasehold', 'Sectional Title'], required: true },
      { name: 'hasDisputes', label: 'Are there any disputes or caveats?', type: 'boolean', required: false },
      { name: 'hasMortgage', label: 'Property has existing mortgage?', type: 'boolean', required: false }
    ],
    'Business Acquisition': [
      { name: 'dealValue', label: 'Company valuation/purchase price (KES)', type: 'number', required: true },
      { name: 'companyType', label: 'Company type', type: 'select', options: ['Private Limited', 'LLC', 'Partnership', 'Sole Proprietor'], required: true },
      { name: 'numberOfEmployees', label: 'Number of employees', type: 'number', required: false },
      { name: 'industry', label: 'Industry/sector', type: 'text', required: true },
      { name: 'hasLiabilities', label: 'Company has outstanding liabilities?', type: 'boolean', required: false }
    ],
    'Debt Collection': [
      { name: 'claimAmount', label: 'Total amount owed (KES)', type: 'number', required: true },
      { name: 'debtType', label: 'Type of debt', type: 'select', options: ['Commercial', 'Personal Loan', 'Unpaid Services', 'Rent Arrears'], required: true },
      { name: 'debtAge', label: 'How old is this debt?', type: 'select', options: ['Less than 6 months', '6-12 months', '1-2 years', 'Over 2 years'], required: true },
      { name: 'hasContract', label: 'Do you have a written contract?', type: 'boolean', required: false },
      { name: 'hasCollateral', label: 'Is there collateral or security?', type: 'boolean', required: false }
    ],
    'Business Registration': [
      { name: 'businessType', label: 'Business type', type: 'select', options: ['Sole Proprietor', 'Partnership', 'Limited Company', 'NGO'], required: true },
      { name: 'numberOfDirectors', label: 'Number of directors/partners', type: 'number', required: false },
      { name: 'hasNameReserved', label: 'Have you reserved the business name?', type: 'boolean', required: false },
      { name: 'needsTaxRegistration', label: 'Need KRA PIN registration?', type: 'boolean', required: false }
    ],
    'Will Drafting': [
      { name: 'complexity', label: 'Will complexity', type: 'select', options: ['Simple Will', 'Standard Will', 'Complex Will with Trusts'], required: true },
      { name: 'numberOfBeneficiaries', label: 'Number of beneficiaries', type: 'number', required: false },
      { name: 'hasInternationalAssets', label: 'Assets outside Kenya?', type: 'boolean', required: false },
      { name: 'hasBusiness', label: 'Include business succession?', type: 'boolean', required: false }
    ],
    'Employment Contract': [
      { name: 'complexity', label: 'Contract type', type: 'select', options: ['Simple', 'Standard', 'Executive'], required: true },
      { name: 'numberOfEmployees', label: 'Number of employees', type: 'number', required: false },
      { name: 'includesNonCompete', label: 'Include non-compete clause?', type: 'boolean', required: false }
    ],
    'Divorce/Family Law': [
      { name: 'serviceType', label: 'Service type', type: 'select', options: ['Uncontested', 'Contested - No Children', 'Contested - With Children'], required: true },
      { name: 'hasProperty', label: 'Property to be divided?', type: 'boolean', required: false },
      { name: 'needsCustody', label: 'Child custody arrangement needed?', type: 'boolean', required: false }
    ]
  };

  return fieldMappings[serviceCategory] || [];
};
