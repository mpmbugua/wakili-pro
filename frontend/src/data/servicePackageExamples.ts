export interface ServicePackageExample {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  description: string;
  priceRange: { min: number; max: number };
  deliveryTime: string;
  whatIncluded: string[];
  targetClients: string[];
  legalBasis?: string[];
  type: 'CONSULTATION' | 'DOCUMENT_DRAFTING' | 'LEGAL_REVIEW' | 'IP_FILING' | 'DISPUTE_MEDIATION' | 'CONTRACT_NEGOTIATION';
}

export const servicePackageExamples: ServicePackageExample[] = [
  // Property & Conveyancing
  {
    id: 'land-conveyancing',
    title: 'Land Purchase Conveyancing Package',
    category: 'Property & Conveyancing',
    subcategory: 'Land Transfer',
    description: 'Complete land transfer service from search to registration. Includes title search, due diligence, consent processing, and final registration.',
    priceRange: { min: 0, max: 0 },
    deliveryTime: '14-21 days',
    type: 'DOCUMENT_DRAFTING',
    whatIncluded: [
      'Official title search at Land Registry',
      'Due diligence and encumbrance report',
      'Sale agreement drafting',
      'Land Control Board consent application',
      'Stamp duty assessment and payment',
      'Transfer document preparation',
      'Final registration at Lands office',
      'Title deed collection and handover'
    ],
    targetClients: ['Property buyers', 'Real estate investors', 'First-time home buyers'],
    legalBasis: ['Land Registration Act 2012', 'Land Control Act', 'Stamp Duty Act']
  },
  {
    id: 'property-transfer',
    title: 'Property Transfer Service',
    category: 'Property & Conveyancing',
    subcategory: 'Transfer',
    description: 'End-to-end property transfer documentation and registration services.',
    priceRange: { min: 35000, max: 50000 },
    deliveryTime: '10-14 days',
    type: 'DOCUMENT_DRAFTING',
    whatIncluded: [
      'Title verification and search',
      'Transfer documents preparation',
      'Consent processing',
      'Stamp duty calculation',
      'Registration services',
      'Title deed issuance'
    ],
    targetClients: ['Property sellers', 'Estate administrators', 'Family transfers'],
    legalBasis: ['Land Registration Act 2012']
  },
  {
    id: 'lease-agreement',
    title: 'Residential Lease Agreement',
    category: 'Property & Conveyancing',
    subcategory: 'Tenancy',
    description: 'Landlord-tenant agreement with Kenyan law compliance. Protect your rental property rights.',
    priceRange: { min: 5000, max: 15000 },
    deliveryTime: '1-2 days',
    type: 'DOCUMENT_DRAFTING',
    whatIncluded: [
      'Customized tenancy agreement',
      'Rent Restriction Tribunal compliance',
      'Deposit protection clause',
      'Maintenance obligations',
      'Termination procedures',
      'Dispute resolution mechanism',
      'Notice templates',
      'Signing guidance'
    ],
    targetClients: ['Landlords', 'Property managers', 'Tenants'],
    legalBasis: ['Landlord and Tenant Act', 'Distress for Rent Act']
  },

  // Business & Corporate
  {
    id: 'company-registration',
    title: 'Company Registration - Full Service',
    category: 'Business & Corporate',
    subcategory: 'Incorporation',
    description: 'End-to-end company incorporation package. Name search, BRS registration, KRA PIN, and all compliance documents.',
    priceRange: { min: 0, max: 0 },
    deliveryTime: '7-10 days',
    type: 'DOCUMENT_DRAFTING',
    whatIncluded: [
      'Company name search and reservation',
      'Memorandum and Articles of Association',
      'CR1 and CR12 filing',
      'Business Registration Service submission',
      'KRA PIN application',
      'Certificate of Incorporation',
      'CR12 Certificate',
      'First Directors meeting minutes'
    ],
    targetClients: ['Entrepreneurs', 'Small businesses', 'Startups', 'Foreign investors'],
    legalBasis: ['Companies Act 2015', 'Business Registration Service Act']
  },
  {
    id: 'partnership-agreement',
    title: 'Business Partnership Agreement',
    category: 'Business & Corporate',
    subcategory: 'Agreements',
    description: 'Comprehensive partnership deed with profit-sharing, decision-making structure, and exit provisions.',
    priceRange: { min: 15000, max: 25000 },
    deliveryTime: '3-5 days',
    type: 'DOCUMENT_DRAFTING',
    whatIncluded: [
      'Partnership deed drafting',
      'Profit and loss sharing arrangements',
      'Capital contribution terms',
      'Decision-making structure',
      'Management responsibilities',
      'Exit and dissolution provisions',
      'Dispute resolution clause',
      'IP ownership protection'
    ],
    targetClients: ['Business partners', 'Joint ventures', 'Professional partnerships'],
    legalBasis: ['Partnership Act Cap 29']
  },
  {
    id: 'shareholder-agreement',
    title: 'Shareholder Agreement',
    category: 'Business & Corporate',
    subcategory: 'Corporate Governance',
    description: 'Detailed shareholder rights, obligations, and dispute resolution framework.',
    priceRange: { min: 25000, max: 40000 },
    deliveryTime: '5-7 days',
    type: 'DOCUMENT_DRAFTING',
    whatIncluded: [
      'Shareholder rights and obligations',
      'Share transfer restrictions',
      'Pre-emptive rights clause',
      'Dividend policy framework',
      'Board composition and voting',
      'Dispute resolution mechanism',
      'Exit strategy provisions',
      'Non-compete clauses'
    ],
    targetClients: ['Companies', 'Investors', 'Directors'],
    legalBasis: ['Companies Act 2015']
  },

  // Family Law
  {
    id: 'divorce-uncontested',
    title: 'Divorce - Uncontested Package',
    category: 'Family Law',
    subcategory: 'Divorce',
    description: 'Streamlined divorce process for mutual consent cases. Includes petition drafting, filing, and decree finalization.',
    priceRange: { min: 0, max: 0 },
    deliveryTime: '30-60 days',
    type: 'DOCUMENT_DRAFTING',
    whatIncluded: [
      'Initial consultation (1 hour)',
      'Petition for divorce drafting',
      'Court filing and service',
      'Consent terms negotiation',
      'Decree Nisi application',
      'Decree Absolute processing',
      'Property division agreement',
      'Child custody arrangements (if applicable)'
    ],
    targetClients: ['Married couples', 'Separated spouses'],
    legalBasis: ['Marriage Act 2014', 'Matrimonial Causes Act', 'Matrimonial Property Act 2013']
  },
  {
    id: 'child-custody',
    title: 'Child Custody Agreement',
    category: 'Family Law',
    subcategory: 'Custody',
    description: 'Co-parenting agreement for separated or divorced parents. Covers visitation, financial support, and decision-making.',
    priceRange: { min: 20000, max: 35000 },
    deliveryTime: '7-14 days',
    type: 'DOCUMENT_DRAFTING',
    whatIncluded: [
      'Best interests assessment framework',
      'Visitation schedule drafting',
      'Child support calculation',
      'Education decision-making',
      'Healthcare responsibilities',
      'Holiday and vacation arrangements',
      'Communication protocols',
      'Modification procedures'
    ],
    targetClients: ['Divorced parents', 'Separated couples', 'Guardians'],
    legalBasis: ['Children Act 2022']
  },
  {
    id: 'prenuptial-agreement',
    title: 'Prenuptial Agreement',
    category: 'Family Law',
    subcategory: 'Marriage',
    description: 'Pre-marriage agreement to protect assets and define property rights. Compliant with Matrimonial Property Act 2013.',
    priceRange: { min: 25000, max: 45000 },
    deliveryTime: '5-10 days',
    type: 'DOCUMENT_DRAFTING',
    whatIncluded: [
      'Asset inventory and disclosure',
      'Property ownership definition',
      'Debt allocation framework',
      'Inheritance rights protection',
      'Financial disclosure schedules',
      'Business interest protection',
      'Spousal support provisions',
      'Review and modification clause'
    ],
    targetClients: ['Engaged couples', 'High-net-worth individuals', 'Business owners'],
    legalBasis: ['Matrimonial Property Act 2013']
  },

  // Employment Law
  {
    id: 'employment-contract-review',
    title: 'Employment Contract Review & Negotiation',
    category: 'Employment Law',
    subcategory: 'Contracts',
    description: 'Comprehensive review of employment offer with negotiation support. Ensure your rights are protected.',
    priceRange: { min: 8000, max: 15000 },
    deliveryTime: '2-3 days',
    type: 'LEGAL_REVIEW',
    whatIncluded: [
      'Contract review and analysis',
      'Red flag identification',
      'Clause-by-clause commentary',
      'Employment Act compliance check',
      'Negotiation strategy session',
      'Counter-proposal drafting',
      'Email/call support during negotiation',
      'Final contract review'
    ],
    targetClients: ['Job seekers', 'Employees', 'Executives'],
    legalBasis: ['Employment Act 2007', 'Labour Relations Act']
  },
  {
    id: 'unfair-dismissal',
    title: 'Unfair Dismissal Representation',
    category: 'Employment Law',
    subcategory: 'Disputes',
    description: 'Full representation at Employment and Labour Relations Court for unfair termination cases.',
    priceRange: { min: 50000, max: 100000 },
    deliveryTime: 'Varies (60-180 days)',
    type: 'DISPUTE_MEDIATION',
    whatIncluded: [
      'Case evaluation and merit assessment',
      'Statement of claim drafting',
      'Evidence compilation and witness prep',
      'Court representation',
      'Settlement negotiation',
      'Remedies calculation',
      'Judgment enforcement',
      'Appeal advice (if needed)'
    ],
    targetClients: ['Dismissed employees', 'Workers', 'Terminated staff'],
    legalBasis: ['Employment Act 2007', 'Labour Relations Act']
  },

  // Intellectual Property
  {
    id: 'trademark-registration',
    title: 'Trademark Registration - Kenya',
    category: 'Intellectual Property',
    subcategory: 'Trademarks',
    description: 'Full trademark search, application, and registration with KIPI. Protect your brand nationwide.',
    priceRange: { min: 25000, max: 40000 },
    deliveryTime: '90-120 days',
    type: 'IP_FILING',
    whatIncluded: [
      'Comprehensive trademark search',
      'Search report and registrability advice',
      'TM2 application drafting',
      'KIPI filing and official fees',
      'Examination response handling',
      'Publication monitoring',
      'Opposition handling (if any)',
      'Certificate of registration'
    ],
    targetClients: ['Businesses', 'Entrepreneurs', 'Brand owners', 'Startups'],
    legalBasis: ['Trade Marks Act Cap 506', 'Industrial Property Act 2001']
  },
  {
    id: 'copyright-registration',
    title: 'Copyright Registration',
    category: 'Intellectual Property',
    subcategory: 'Copyright',
    description: 'Copyright registration with Kenya Copyright Board (KECOBO) for literary, artistic, or musical works.',
    priceRange: { min: 15000, max: 30000 },
    deliveryTime: '30-60 days',
    type: 'IP_FILING',
    whatIncluded: [
      'Copyright assessment and eligibility',
      'Application form preparation',
      'Work samples compilation',
      'KECOBO filing',
      'Official fees payment',
      'Certificate processing',
      'Infringement advice',
      'Licensing guidance'
    ],
    targetClients: ['Authors', 'Artists', 'Musicians', 'Content creators'],
    legalBasis: ['Copyright Act 2001']
  },

  // Immigration
  {
    id: 'work-permit',
    title: 'Work Permit Application - Kenya',
    category: 'Immigration',
    subcategory: 'Work Permits',
    description: 'Class D, G, or I work permit application with documentation support and eFNS submission.',
    priceRange: { min: 50000, max: 80000 },
    deliveryTime: '60-90 days',
    type: 'DOCUMENT_DRAFTING',
    whatIncluded: [
      'Eligibility assessment',
      'Document checklist and review',
      'Application form completion',
      'Supporting documents preparation',
      'eFNS portal submission',
      'Query response handling',
      'Status tracking and updates',
      'Permit collection assistance'
    ],
    targetClients: ['Foreign workers', 'Expatriates', 'Employers', 'Companies'],
    legalBasis: ['Kenya Citizenship and Immigration Act 2011']
  },
  {
    id: 'dependent-pass',
    title: 'Dependent Pass Application',
    category: 'Immigration',
    subcategory: 'Dependent Passes',
    description: 'Dependent pass for family members of work permit holders.',
    priceRange: { min: 30000, max: 50000 },
    deliveryTime: '45-60 days',
    type: 'DOCUMENT_DRAFTING',
    whatIncluded: [
      'Eligibility verification',
      'Family documentation preparation',
      'Application form completion',
      'Relationship proof compilation',
      'eFNS submission',
      'Status monitoring',
      'Pass collection'
    ],
    targetClients: ['Expatriate families', 'Dependents', 'Spouses'],
    legalBasis: ['Kenya Citizenship and Immigration Act 2011']
  },

  // Litigation
  {
    id: 'debt-recovery',
    title: 'Debt Recovery - Demand Letter Package',
    category: 'Litigation',
    subcategory: 'Debt Recovery',
    description: 'Professional debt recovery service including demand letter, follow-up, and settlement negotiation.',
    priceRange: { min: 8000, max: 15000 },
    deliveryTime: '3-5 days',
    type: 'DISPUTE_MEDIATION',
    whatIncluded: [
      'Debt analysis and verification',
      'Formal demand letter drafting',
      'Registered delivery to debtor',
      'Follow-up communication (2 rounds)',
      'Settlement negotiation',
      'Payment plan structuring',
      'Release documentation',
      'Court filing advice (if needed)'
    ],
    targetClients: ['Creditors', 'Businesses', 'Individuals owed money'],
    legalBasis: ['Civil Procedure Act', 'Law of Contract Act']
  },
  {
    id: 'civil-representation',
    title: 'Civil Case Representation',
    category: 'Litigation',
    subcategory: 'Court Representation',
    description: 'Full court representation for civil disputes including contract matters, property disputes, and debt recovery.',
    priceRange: { min: 80000, max: 200000 },
    deliveryTime: 'Varies (90-365 days)',
    type: 'DISPUTE_MEDIATION',
    whatIncluded: [
      'Case evaluation and strategy',
      'Plaint/defense drafting',
      'Court filing and service',
      'Evidence gathering and management',
      'Witness preparation',
      'Trial representation',
      'Settlement negotiation',
      'Judgment enforcement'
    ],
    targetClients: ['Plaintiffs', 'Defendants', 'Businesses'],
    legalBasis: ['Civil Procedure Act', 'Evidence Act']
  },

  // Tax & Compliance
  {
    id: 'tax-compliance',
    title: 'Tax Compliance Package',
    category: 'Tax & Compliance',
    subcategory: 'Tax Services',
    description: 'Complete tax registration, filing, and KRA compliance services.',
    priceRange: { min: 20000, max: 40000 },
    deliveryTime: '10-15 days',
    type: 'DOCUMENT_DRAFTING',
    whatIncluded: [
      'KRA PIN registration/verification',
      'Tax returns preparation and filing',
      'VAT compliance setup',
      'PAYE administration',
      'Withholding tax guidance',
      'Tax compliance audit',
      'KRA representation',
      'Penalty waiver applications'
    ],
    targetClients: ['Businesses', 'Self-employed', 'Employers'],
    legalBasis: ['Income Tax Act', 'VAT Act 2013', 'Tax Procedures Act']
  }
];

export const serviceCategories = [
  'Property & Conveyancing',
  'Business & Corporate',
  'Family Law',
  'Employment Law',
  'Intellectual Property',
  'Immigration',
  'Litigation',
  'Tax & Compliance'
];

export const getExamplesByCategory = (category: string): ServicePackageExample[] => {
  return servicePackageExamples.filter(example => example.category === category);
};

export const getFeaturedExamples = (): ServicePackageExample[] => {
  return [
    servicePackageExamples.find(e => e.id === 'land-conveyancing')!,
    servicePackageExamples.find(e => e.id === 'company-registration')!,
    servicePackageExamples.find(e => e.id === 'divorce-uncontested')!,
    servicePackageExamples.find(e => e.id === 'employment-contract-review')!,
    servicePackageExamples.find(e => e.id === 'trademark-registration')!,
    servicePackageExamples.find(e => e.id === 'debt-recovery')!,
    servicePackageExamples.find(e => e.id === 'work-permit')!,
    servicePackageExamples.find(e => e.id === 'lease-agreement')!,
  ];
};
