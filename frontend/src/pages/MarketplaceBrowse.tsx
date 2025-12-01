import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import axiosInstance from '../lib/axios';

interface Document {
  id: string;
  title: string;
  category: string;
  description: string;
  price: number;
  downloads: number;
  rating: number;
  reviewCount: number;
  pages: number;
  format: string;
  lastUpdated: string;
  features: string[];
  previewAvailable: boolean;
}

// Sample marketplace data (will be replaced with backend API)
const sampleDocuments: Document[] = [
  {
    id: '1',
    title: 'Employment Contract Template',
    category: 'Employment',
    description: 'Comprehensive employment agreement template compliant with Kenya Employment Act 2007. Includes clauses for salary, benefits, termination, and confidentiality.',
    price: 1200,
    downloads: 487,
    rating: 4.8,
    reviewCount: 92,
    pages: 8,
    format: 'PDF + DOCX',
    lastUpdated: '2024-01',
    features: ['Legally vetted', 'Editable format', 'Includes instructions', 'Valid in Kenya'],
    previewAvailable: true
  },
  {
    id: '2',
    title: 'Land Sale Agreement',
    category: 'Property',
    description: 'Standard land purchase agreement for property transactions in Kenya. Covers payment terms, title transfer, and dispute resolution.',
    price: 1500,
    downloads: 623,
    rating: 4.9,
    reviewCount: 145,
    pages: 12,
    format: 'PDF + DOCX',
    lastUpdated: '2024-01',
    features: ['Land Act 2012 compliant', 'Editable terms', 'Transfer procedure guide', 'Stamp duty info'],
    previewAvailable: true
  },
  {
    id: '3',
    title: 'Divorce Petition Guide',
    category: 'Family Law',
    description: 'Step-by-step guide to filing for divorce in Kenya, including petition templates, process timeline, and required documents.',
    price: 800,
    downloads: 234,
    rating: 4.7,
    reviewCount: 58,
    pages: 15,
    format: 'PDF',
    lastUpdated: '2023-12',
    features: ['Marriage Act 2014 aligned', 'Court filing checklist', 'Custody considerations', 'Asset division guide'],
    previewAvailable: true
  },
  {
    id: '4',
    title: 'Business Partnership Agreement',
    category: 'Corporate',
    description: 'Detailed partnership agreement template for business ventures. Includes profit sharing, decision-making, and exit provisions.',
    price: 2000,
    downloads: 356,
    rating: 5.0,
    reviewCount: 67,
    pages: 10,
    format: 'PDF + DOCX',
    lastUpdated: '2024-02',
    features: ['Partnership Act compliant', 'Customizable clauses', 'Dispute resolution', 'IP protection'],
    previewAvailable: true
  },
  {
    id: '5',
    title: 'Tenant Lease Agreement',
    category: 'Property',
    description: 'Residential lease agreement for landlords and tenants. Covers rent, deposits, maintenance, and termination procedures.',
    price: 600,
    downloads: 892,
    rating: 4.6,
    reviewCount: 178,
    pages: 6,
    format: 'PDF + DOCX',
    lastUpdated: '2024-01',
    features: ['Rent Restriction Act aligned', 'Deposit protection', 'Eviction procedure', 'Maintenance terms'],
    previewAvailable: true
  },
  {
    id: '6',
    title: 'Will and Testament Template',
    category: 'Succession',
    description: 'Legally valid will template for estate planning in Kenya. Includes executor appointment, asset distribution, and guardianship.',
    price: 1000,
    downloads: 445,
    rating: 4.9,
    reviewCount: 103,
    pages: 7,
    format: 'PDF + DOCX',
    lastUpdated: '2023-11',
    features: ['Law of Succession Act compliant', 'Witness requirements', 'Executor guide', 'Asset inventory'],
    previewAvailable: true
  },
  {
    id: '7',
    title: 'Non-Disclosure Agreement (NDA)',
    category: 'Corporate',
    description: 'Standard NDA for protecting confidential business information. Suitable for employees, contractors, and business partners.',
    price: 500,
    downloads: 721,
    rating: 4.5,
    reviewCount: 134,
    pages: 4,
    format: 'PDF + DOCX',
    lastUpdated: '2024-02',
    features: ['Enforceable in Kenya', 'Mutual or unilateral', 'Customizable duration', 'Penalty clauses'],
    previewAvailable: true
  },
  {
    id: '8',
    title: 'Loan Agreement Template',
    category: 'Financial',
    description: 'Personal or business loan agreement with repayment schedule, interest terms, and default provisions.',
    price: 900,
    downloads: 567,
    rating: 4.7,
    reviewCount: 89,
    pages: 9,
    format: 'PDF + DOCX',
    lastUpdated: '2024-01',
    features: ['Interest rate calculator', 'Repayment schedule', 'Collateral terms', 'Default procedure'],
    previewAvailable: true
  },
  {
    id: '9',
    title: 'Vehicle Sale Agreement',
    category: 'Transport',
    description: 'Motor vehicle sale agreement for private car sales. Includes transfer procedures, NTSA requirements, and warranty clauses.',
    price: 700,
    downloads: 1234,
    rating: 4.8,
    reviewCount: 267,
    pages: 5,
    format: 'PDF + DOCX',
    lastUpdated: '2024-03',
    features: ['NTSA CR12 guide', 'Warranty template', 'Payment terms', 'Transfer checklist'],
    previewAvailable: true
  },
  {
    id: '9a',
    title: 'Car Hire Agreement',
    category: 'Transport',
    description: 'Vehicle rental agreement for car hire businesses. Covers daily/weekly/monthly rentals, insurance, damage liability, and deposit terms.',
    price: 750,
    downloads: 856,
    rating: 4.7,
    reviewCount: 189,
    pages: 6,
    format: 'PDF + DOCX',
    lastUpdated: '2024-11',
    features: ['Insurance clauses', 'Damage assessment', 'Fuel policy', 'Mileage limits', 'Late return fees', 'Security deposit'],
    previewAvailable: true
  },
  {
    id: '10',
    title: 'Power of Attorney',
    category: 'Legal',
    description: 'General or specific power of attorney document. Authorize someone to act on your behalf for property, financial, or legal matters.',
    price: 800,
    downloads: 423,
    rating: 4.6,
    reviewCount: 95,
    pages: 4,
    format: 'PDF + DOCX',
    lastUpdated: '2024-02',
    features: ['Notarization guide', 'Revocation clause', 'Specific vs general', 'Witness requirements'],
    previewAvailable: true
  },
  {
    id: '11',
    title: 'Prenuptial Agreement',
    category: 'Family Law',
    description: 'Pre-marriage agreement to protect assets and define property rights. Compliant with Matrimonial Property Act 2013.',
    price: 1800,
    downloads: 156,
    rating: 4.9,
    reviewCount: 34,
    pages: 11,
    format: 'PDF + DOCX',
    lastUpdated: '2024-01',
    features: ['Asset protection', 'Debt allocation', 'Inheritance rights', 'Financial disclosure'],
    previewAvailable: true
  },
  {
    id: '12',
    title: 'Machinery Lease Agreement',
    category: 'Equipment',
    description: 'Comprehensive machinery and equipment lease agreement for construction, agriculture, or industrial equipment. Includes maintenance, insurance, and liability terms.',
    price: 1400,
    downloads: 289,
    rating: 4.8,
    reviewCount: 56,
    pages: 10,
    format: 'PDF + DOCX',
    lastUpdated: '2024-03',
    features: ['Maintenance obligations', 'Insurance requirements', 'Liability clauses', 'Repair procedures'],
    previewAvailable: true
  },
  {
    id: '13',
    title: 'Machinery Sale Agreement',
    category: 'Equipment',
    description: 'Equipment and machinery purchase agreement for heavy machinery, industrial equipment, or agricultural tools. Covers warranty, inspection, and delivery terms.',
    price: 1600,
    downloads: 367,
    rating: 4.9,
    reviewCount: 78,
    pages: 12,
    format: 'PDF + DOCX',
    lastUpdated: '2024-03',
    features: ['Warranty terms', 'Inspection checklist', 'Delivery conditions', 'Payment schedule'],
    previewAvailable: true
  },
  {
    id: '14',
    title: 'Service Agreement Contract',
    category: 'Corporate',
    description: 'Professional services contract for consultants, freelancers, and contractors. Includes scope of work, payment terms, and deliverables.',
    price: 950,
    downloads: 678,
    rating: 4.7,
    reviewCount: 143,
    pages: 7,
    format: 'PDF + DOCX',
    lastUpdated: '2024-02',
    features: ['Scope of work template', 'Milestone payments', 'IP ownership', 'Termination clause'],
    previewAvailable: true
  },
  {
    id: '15',
    title: 'Company Incorporation Guide',
    category: 'Corporate',
    description: 'Complete guide to registering a limited company in Kenya. Includes Memorandum, Articles of Association, and BRS filing steps.',
    price: 2500,
    downloads: 389,
    rating: 5.0,
    reviewCount: 78,
    pages: 20,
    format: 'PDF + DOCX',
    lastUpdated: '2024-03',
    features: ['eCitizen process', 'CR1 forms', 'Director resolutions', 'KRA PIN application'],
    previewAvailable: true
  },
  {
    id: '16',
    title: 'Demand Letter Template',
    category: 'Legal',
    description: 'Professional demand letter for debt recovery, contract breach, or dispute resolution. Multiple templates for different scenarios.',
    price: 400,
    downloads: 892,
    rating: 4.5,
    reviewCount: 201,
    pages: 3,
    format: 'PDF + DOCX',
    lastUpdated: '2024-02',
    features: ['Multiple scenarios', 'Legal language', 'Timeline guidance', 'Follow-up templates'],
    previewAvailable: true
  },
  {
    id: '17',
    title: 'Affidavit Template',
    category: 'Legal',
    description: 'Sworn affidavit template for court proceedings, name change, lost documents, and other legal purposes.',
    price: 300,
    downloads: 1456,
    rating: 4.4,
    reviewCount: 312,
    pages: 2,
    format: 'PDF + DOCX',
    lastUpdated: '2024-01',
    features: ['Commissioner of oaths guide', 'Multiple use cases', 'Proper formatting', 'Evidence rules'],
    previewAvailable: true
  },
  {
    id: '18',
    title: 'Property Rental Agreement (Commercial)',
    category: 'Property',
    description: 'Commercial property lease for offices, shops, and business premises. Includes rent review, fit-out, and business use clauses.',
    price: 1300,
    downloads: 267,
    rating: 4.8,
    reviewCount: 56,
    pages: 14,
    format: 'PDF + DOCX',
    lastUpdated: '2024-02',
    features: ['Rent escalation', 'Service charge', 'Permitted use', 'Renewal terms'],
    previewAvailable: true
  },
  {
    id: '19',
    title: 'Child Custody Agreement',
    category: 'Family Law',
    description: 'Co-parenting agreement for separated or divorced parents. Covers visitation, financial support, and decision-making.',
    price: 1100,
    downloads: 334,
    rating: 4.9,
    reviewCount: 72,
    pages: 8,
    format: 'PDF + DOCX',
    lastUpdated: '2024-01',
    features: ['Best interests framework', 'Visitation schedule', 'Child support', 'Education decisions'],
    previewAvailable: true
  },
  {
    id: '20',
    title: 'Supplier Agreement',
    category: 'Corporate',
    description: 'Business-to-business supply agreement for goods and services. Includes quality standards, delivery terms, and payment conditions.',
    price: 1400,
    downloads: 423,
    rating: 4.6,
    reviewCount: 89,
    pages: 10,
    format: 'PDF + DOCX',
    lastUpdated: '2024-03',
    features: ['Quality specs', 'Delivery terms', 'Payment schedule', 'Breach remedies'],
    previewAvailable: true
  },
  {
    id: '21',
    title: 'Statutory Demand',
    category: 'Financial',
    description: 'Formal demand for payment of debt under Insolvency Act. Precursor to bankruptcy or liquidation proceedings.',
    price: 600,
    downloads: 198,
    rating: 4.7,
    reviewCount: 41,
    pages: 3,
    format: 'PDF + DOCX',
    lastUpdated: '2024-02',
    features: ['21-day notice', 'Insolvency Act compliant', 'Service requirements', 'Dispute procedure'],
    previewAvailable: true
  },
  {
    id: '22',
    title: 'Share Purchase Agreement',
    category: 'Corporate',
    description: 'Agreement for buying or selling company shares. Includes warranties, indemnities, and completion conditions.',
    price: 3000,
    downloads: 145,
    rating: 5.0,
    reviewCount: 28,
    pages: 18,
    format: 'PDF + DOCX',
    lastUpdated: '2024-03',
    features: ['Warranties & indemnities', 'Due diligence checklist', 'Completion mechanics', 'Escrow arrangement'],
    previewAvailable: true
  },
  {
    id: '23',
    title: 'Residential Property Rental Agreement',
    category: 'Property',
    description: 'Comprehensive residential tenancy agreement for house or apartment rentals. Covers rent payments, security deposits, utilities, repairs, and tenant obligations.',
    price: 650,
    downloads: 1567,
    rating: 4.9,
    reviewCount: 298,
    pages: 7,
    format: 'PDF + DOCX',
    lastUpdated: '2024-03',
    features: ['Monthly/annual lease options', 'Utility clauses', 'Repair responsibilities', 'Notice periods'],
    previewAvailable: true
  },
  {
    id: '24',
    title: 'Freelance Contract Agreement',
    category: 'Employment',
    description: 'Independent contractor agreement for freelancers and gig workers. Defines project scope, payment terms, and intellectual property rights.',
    price: 850,
    downloads: 892,
    rating: 4.7,
    reviewCount: 167,
    pages: 6,
    format: 'PDF + DOCX',
    lastUpdated: '2024-03',
    features: ['Project milestones', 'Payment schedule', 'IP ownership', 'Confidentiality'],
    previewAvailable: true
  },
  {
    id: '25',
    title: 'Memorandum of Understanding (MOU)',
    category: 'Corporate',
    description: 'Formal agreement outlining terms between two or more parties. Suitable for business partnerships, collaborations, and joint ventures.',
    price: 700,
    downloads: 534,
    rating: 4.6,
    reviewCount: 112,
    pages: 5,
    format: 'PDF + DOCX',
    lastUpdated: '2024-03',
    features: ['Binding vs non-binding', 'Collaboration terms', 'Resource sharing', 'Exit strategy'],
    previewAvailable: true
  },
  {
    id: '26',
    title: 'Board Resolution Template',
    category: 'Corporate',
    description: 'Official board resolution document for company decisions, director appointments, share transfers, and major transactions.',
    price: 450,
    downloads: 421,
    rating: 4.8,
    reviewCount: 89,
    pages: 3,
    format: 'PDF + DOCX',
    lastUpdated: '2024-03',
    features: ['Multiple scenarios', 'Proper formatting', 'Voting records', 'Filing ready'],
    previewAvailable: true
  },
  {
    id: '27',
    title: 'Construction Contract',
    category: 'Property',
    description: 'Building and construction agreement for residential or commercial projects. Includes timelines, payment stages, materials, and completion certificates.',
    price: 1800,
    downloads: 256,
    rating: 4.9,
    reviewCount: 54,
    pages: 16,
    format: 'PDF + DOCX',
    lastUpdated: '2024-03',
    features: ['Payment milestones', 'Material specs', 'Delay penalties', 'Defects liability'],
    previewAvailable: true
  },
  {
    id: '28',
    title: 'Deed of Gift',
    category: 'Succession',
    description: 'Legal document for transferring property ownership as a gift. Covers land, vehicles, or other assets without monetary exchange.',
    price: 900,
    downloads: 312,
    rating: 4.7,
    reviewCount: 67,
    pages: 4,
    format: 'PDF + DOCX',
    lastUpdated: '2024-02',
    features: ['Stamp duty guide', 'Transfer procedure', 'Tax implications', 'Witness requirements'],
    previewAvailable: true
  },
  {
    id: '29',
    title: 'Catering Agreement',
    category: 'Corporate',
    description: 'Professional catering services contract for weddings, corporate events, and functions. Covers menu, pricing, staffing, and cancellation terms.',
    price: 850,
    downloads: 1234,
    rating: 4.8,
    reviewCount: 256,
    pages: 6,
    format: 'PDF + DOCX',
    lastUpdated: '2024-11',
    features: ['Menu specifications', 'Staff requirements', 'Equipment rental', 'Payment schedule', 'Cancellation policy', 'Food safety clauses'],
    previewAvailable: true
  },
  {
    id: '30',
    title: 'Domestic Worker Employment Contract',
    category: 'Employment',
    description: 'Employment agreement for house helps, gardeners, security guards, and domestic staff. Compliant with Kenya Labour Laws and includes NSSF/NHIF provisions.',
    price: 550,
    downloads: 2145,
    rating: 4.9,
    reviewCount: 412,
    pages: 5,
    format: 'PDF + DOCX',
    lastUpdated: '2024-11',
    features: ['Salary & allowances', 'Working hours', 'Leave entitlements', 'NSSF/NHIF guide', 'Termination terms', 'Accommodation clause'],
    previewAvailable: true
  },
  {
    id: '31',
    title: 'Employment Termination Agreement',
    category: 'Employment',
    description: 'Mutual separation agreement for ending employment. Includes severance calculation, notice period waiver, and settlement terms.',
    price: 1100,
    downloads: 567,
    rating: 4.7,
    reviewCount: 98,
    pages: 7,
    format: 'PDF + DOCX',
    lastUpdated: '2024-10',
    features: ['Severance calculator', 'Notice waiver', 'Non-compete clause', 'Final settlement', 'Reference letter', 'Dispute waiver'],
    previewAvailable: true
  },
  {
    id: '32',
    title: 'Franchise Agreement',
    category: 'Corporate',
    description: 'Comprehensive franchise agreement for expanding business through franchisees. Covers brand usage, royalties, territories, and operational standards.',
    price: 3500,
    downloads: 178,
    rating: 5.0,
    reviewCount: 34,
    pages: 22,
    format: 'PDF + DOCX',
    lastUpdated: '2024-11',
    features: ['Royalty structure', 'Territory rights', 'Brand guidelines', 'Training requirements', 'Quality standards', 'Renewal terms'],
    previewAvailable: true
  },
  {
    id: '33',
    title: 'Distribution Agreement',
    category: 'Corporate',
    description: 'Product distribution contract between manufacturers and distributors. Defines territories, pricing, targets, and exclusive/non-exclusive rights.',
    price: 1650,
    downloads: 423,
    rating: 4.8,
    reviewCount: 87,
    pages: 12,
    format: 'PDF + DOCX',
    lastUpdated: '2024-10',
    features: ['Territory definition', 'Pricing structure', 'Sales targets', 'Marketing support', 'Stock management', 'Termination clause'],
    previewAvailable: true
  },
  {
    id: '34',
    title: 'Agency Agreement',
    category: 'Corporate',
    description: 'Sales agent or representative agreement. Covers commission structure, territory, reporting, and agent obligations for product/service sales.',
    price: 1250,
    downloads: 634,
    rating: 4.7,
    reviewCount: 124,
    pages: 9,
    format: 'PDF + DOCX',
    lastUpdated: '2024-11',
    features: ['Commission rates', 'Territory rights', 'Sales targets', 'Reporting requirements', 'Expenses policy', 'Non-compete'],
    previewAvailable: true
  },
  {
    id: '35',
    title: 'Property Management Agreement',
    category: 'Property',
    description: 'Contract between property owner and property manager. Covers rent collection, maintenance, tenant management, and management fees.',
    price: 1400,
    downloads: 489,
    rating: 4.9,
    reviewCount: 102,
    pages: 11,
    format: 'PDF + DOCX',
    lastUpdated: '2024-11',
    features: ['Management fee structure', 'Rent collection', 'Maintenance authority', 'Tenant screening', 'Reporting obligations', 'Insurance'],
    previewAvailable: true
  },
  {
    id: '36',
    title: 'Bedsitter Tenancy Agreement',
    category: 'Property',
    description: 'Simplified rental agreement for single-room bedsitters and studio apartments. Affordable and tenant-friendly format.',
    price: 400,
    downloads: 3267,
    rating: 4.8,
    reviewCount: 589,
    pages: 4,
    format: 'PDF + DOCX',
    lastUpdated: '2024-11',
    features: ['Simple language', 'Utility sharing', 'Deposit terms', 'Notice period', 'Affordable pricing', 'Swahili translation'],
    previewAvailable: true
  },
  {
    id: '37',
    title: 'Boundary Dispute Settlement Agreement',
    category: 'Property',
    description: 'Mediated settlement for land boundary disputes. Includes survey requirements, compensation, and dispute resolution framework.',
    price: 1750,
    downloads: 312,
    rating: 4.9,
    reviewCount: 67,
    pages: 8,
    format: 'PDF + DOCX',
    lastUpdated: '2024-10',
    features: ['Survey provisions', 'Compensation formula', 'Mediation framework', 'Beacons placement', 'Registration guide', 'Court filing option'],
    previewAvailable: true
  },
  {
    id: '38',
    title: 'Consent to Travel (Minor)',
    category: 'Family Law',
    description: 'Parental consent for children traveling internationally with one parent, guardian, or alone. Embassy-ready format.',
    price: 350,
    downloads: 1876,
    rating: 4.6,
    reviewCount: 287,
    pages: 2,
    format: 'PDF + DOCX',
    lastUpdated: '2024-11',
    features: ['Notarization guide', 'Embassy requirements', 'Multiple destinations', 'Duration flexibility', 'Guardian details', 'Emergency contacts'],
    previewAvailable: true
  },
  {
    id: '39',
    title: 'Guarantee Agreement',
    category: 'Financial',
    description: 'Personal or corporate guarantee for loans and credit facilities. Defines guarantor obligations, liability limits, and release conditions.',
    price: 1050,
    downloads: 723,
    rating: 4.8,
    reviewCount: 156,
    pages: 8,
    format: 'PDF + DOCX',
    lastUpdated: '2024-11',
    features: ['Liability definition', 'Release conditions', 'Maximum exposure', 'Call procedures', 'Joint guarantees', 'Indemnity clauses'],
    previewAvailable: true
  },
  {
    id: '40',
    title: 'Debt Settlement Agreement',
    category: 'Financial',
    description: 'Restructuring agreement for overdue debts. Includes payment plans, interest waivers, and full & final settlement terms.',
    price: 750,
    downloads: 1456,
    rating: 4.7,
    reviewCount: 298,
    pages: 6,
    format: 'PDF + DOCX',
    lastUpdated: '2024-10',
    features: ['Payment plan template', 'Interest reduction', 'Lump sum discount', 'Default consequences', 'Credit bureau reporting', 'Legal protection'],
    previewAvailable: true
  }
];

const categories = ['All Categories', 'Employment', 'Property', 'Family Law', 'Corporate', 'Succession', 'Financial', 'Transport', 'Equipment', 'Legal'];

export const MarketplaceBrowse: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'rating'>('popular');
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  // Check for pending purchase after login/registration
  useEffect(() => {
    const pendingPurchase = sessionStorage.getItem('pendingPurchase');
    if (pendingPurchase && isAuthenticated) {
      try {
        const { docId, docTitle } = JSON.parse(pendingPurchase);
        sessionStorage.removeItem('pendingPurchase');
        // Auto-trigger purchase for this document
        handlePurchaseDocument(docId, docTitle);
      } catch (error) {
        console.error('Error parsing pending purchase:', error);
        sessionStorage.removeItem('pendingPurchase');
      }
    }
  }, [isAuthenticated]);

  // Filter and sort documents
  const filteredDocuments = sampleDocuments
    .filter(doc =>
      (selectedCategory === 'All Categories' || doc.category === selectedCategory) &&
      (searchQuery === '' || 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'popular') return b.downloads - a.downloads;
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  const handlePurchaseDocument = async (docId: string, docTitle: string) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('pendingPurchase', JSON.stringify({ docId, docTitle }));
      navigate('/login', { state: { from: '/marketplace', message: 'Please log in to purchase documents' } });
    } else {
      // Find the document and initiate purchase directly
      const doc = sampleDocuments.find(d => d.id === docId);
      if (doc) {
        try {
          // Create purchase record in backend first
          const response = await axiosInstance.post('/documents/marketplace/purchase', {
            templateId: doc.id,
            documentTitle: doc.title,
            price: doc.price
          });

          if (response.data.success) {
            const purchaseId = response.data.data.id;
            
            // Get phone number for M-Pesa payment
            const phoneNumber = prompt('Enter your M-Pesa phone number (format: 254XXXXXXXXX):');
            
            if (!phoneNumber) {
              alert('Phone number is required for payment');
              return;
            }

            // Initiate M-Pesa payment using unified endpoint
            console.log('[MarketplaceBrowse] Initiating M-Pesa payment:', {
              purchaseId,
              amount: doc.price,
              phoneNumber
            });

            const paymentResponse = await axiosInstance.post('/payments/mpesa/initiate', {
              phoneNumber: phoneNumber,
              amount: doc.price,
              purchaseId: purchaseId,
              paymentType: 'MARKETPLACE_PURCHASE'
            });

            if (paymentResponse.data.success) {
              alert(`Purchase initiated!\n\nM-Pesa payment request sent to ${phoneNumber}\n\nPlease complete the payment on your phone.\n\nDocument: ${doc.title}\nAmount: KES ${doc.price}`);
              navigate('/marketplace');
            } else {
              alert(paymentResponse.data.message || 'Failed to initiate payment');
            }
          } else {
            alert(response.data.message || 'Failed to initiate purchase');
          }
        } catch (error: any) {
          console.error('Purchase initiation error:', error);
          alert(error.response?.data?.message || 'Failed to initiate purchase. Please try again.');
        }
      }
    }
  };

  return (
    <>
      {/* Search and Filters */}
      <div className="bg-white border-b border-blue-200 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            {/* Category Filter */}
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-slate-900"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Results Count */}
            <div className="text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{filteredDocuments.length}</span> documents available
            </div>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden flex flex-col"
            >
              {/* Document Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                <div className="flex items-start justify-between mb-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                    {doc.category}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="text-yellow-300">★</span>
                    <span className="text-sm font-semibold">{doc.rating}</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold mt-3">{doc.title}</h3>
              </div>

              {/* Document Details */}
              <div className="p-6 flex-1 flex flex-col">
                <p className="text-sm text-gray-700 mb-4 line-clamp-3">{doc.description}</p>

                {/* Features */}
                <div className="space-y-2 mb-4">
                  {doc.features.slice(0, 3).map((feature, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>

                {/* Document Info */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-200 text-center text-sm mb-4">
                  <div>
                    <p className="text-gray-500 text-xs">Pages</p>
                    <p className="font-semibold text-gray-900">{doc.pages}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Format</p>
                    <p className="font-semibold text-gray-900 text-xs">{doc.format}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Downloads</p>
                    <p className="font-semibold text-gray-900">{doc.downloads}</p>
                  </div>
                </div>

                {/* Price and CTA */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">One-time payment</p>
                      <p className="text-2xl font-bold text-gray-900">KES {doc.price.toLocaleString()}</p>
                    </div>
                    {doc.previewAvailable && (
                      <button 
                        onClick={() => setPreviewDocument(doc)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Preview →
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => handlePurchaseDocument(doc.id, doc.title)}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    Purchase Document
                  </button>

                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {doc.reviewCount} verified reviews • Updated {doc.lastUpdated}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No documents found matching your search.</p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Categories');
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 border-t border-blue-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Why Choose Our Legal Documents?</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Professional, legally compliant templates trusted by thousands of Kenyan businesses and individuals</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 text-center border border-blue-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Secure Downloads</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Encrypted transactions with instant access to your documents. Your data is protected with bank-level security.</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 text-center border border-blue-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Legally Vetted</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Every document is reviewed and approved by qualified Kenyan lawyers to ensure full legal compliance.</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-8 text-center border border-blue-100">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Editable Templates</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Fully customizable Word and PDF formats. Modify terms to perfectly match your specific needs.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Access Legal Documents?</h2>
            <p className="text-lg mb-6 text-purple-100">
              Create a free account to purchase documents, save favorites, and get instant downloads.
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => navigate('/register', { state: { from: '/marketplace' } })}
                className="px-8 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-gray-100 transition"
              >
                Create Free Account
              </button>
              <button
                onClick={() => navigate('/login', { state: { from: '/marketplace' } })}
                className="px-8 py-3 bg-purple-700 text-white font-semibold rounded-lg hover:bg-purple-800 transition border-2 border-white"
              >
                Log In
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewDocument(null)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 text-white">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-semibold">
                      {previewDocument.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-300">★</span>
                      <span className="text-sm font-semibold">{previewDocument.rating}</span>
                      <span className="text-xs text-blue-100">({previewDocument.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{previewDocument.title}</h2>
                  <p className="text-blue-100 text-sm">{previewDocument.description}</p>
                </div>
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="ml-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-280px)] px-8 py-6">
              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 text-sm mb-1">Pages</p>
                  <p className="text-2xl font-bold text-slate-900">{previewDocument.pages}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 text-sm mb-1">Format</p>
                  <p className="text-lg font-bold text-slate-900">{previewDocument.format}</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-slate-500 text-sm mb-1">Downloads</p>
                  <p className="text-2xl font-bold text-slate-900">{previewDocument.downloads.toLocaleString()}</p>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">What's Included</h3>
                <div className="grid md:grid-cols-2 gap-3">
                  {previewDocument.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Document Preview Sample</h3>
                <div className="bg-white border-2 border-dashed border-blue-300 rounded-lg p-6 font-mono text-sm text-slate-700 space-y-3">
                  <div className="text-center mb-4">
                    <p className="font-bold text-lg">{previewDocument.title.toUpperCase()}</p>
                    <p className="text-slate-500 text-xs mt-1">Sample Preview - Actual document contains complete legal text</p>
                  </div>
                  <div className="border-t border-slate-200 pt-4 space-y-2">
                    {/* Employment Documents */}
                    {previewDocument.category === 'Employment' && previewDocument.title.includes('Employment Contract') && (
                      <>
                        <p><strong>EMPLOYMENT CONTRACT</strong></p>
                        <p>This Employment Agreement is entered into on _____ day of _________, 20___</p>
                        <p><strong>BETWEEN:</strong></p>
                        <p className="pl-4">Employer: _________________________ ("Company")</p>
                        <p className="pl-4">Employee: _________________________ ("Employee")</p>
                        <p className="mt-4"><strong>1. POSITION AND DUTIES</strong></p>
                        <p className="pl-4">1.1 The Employee shall serve as _________________________</p>
                        <p className="pl-4">1.2 Reporting to: _________________________</p>
                        <p className="mt-4"><strong>2. REMUNERATION</strong></p>
                        <p className="pl-4">2.1 Basic Salary: KES _________ per month</p>
                        <p className="pl-4">2.2 Benefits: Housing, Medical, Transport allowances...</p>
                        <p className="mt-4"><strong>3. TERMINATION</strong></p>
                        <p className="pl-4">3.1 Notice Period: _____ days written notice...</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: Leave entitlements, Confidentiality clauses, Non-compete terms, Intellectual property rights]
                        </p>
                      </>
                    )}
                    
                    {/* Freelance Contract */}
                    {previewDocument.title.includes('Freelance') && (
                      <>
                        <p><strong>FREELANCE CONTRACT AGREEMENT</strong></p>
                        <p>This Agreement is made on _____ day of _________, 20___</p>
                        <p><strong>BETWEEN:</strong></p>
                        <p className="pl-4">Client: _________________________ ("Client")</p>
                        <p className="pl-4">Contractor: _________________________ ("Freelancer")</p>
                        <p className="mt-4"><strong>1. SCOPE OF WORK</strong></p>
                        <p className="pl-4">Services: _________________________</p>
                        <p className="pl-4">Deliverables: _________________________</p>
                        <p className="mt-4"><strong>2. PAYMENT TERMS</strong></p>
                        <p className="pl-4">Rate: KES _________ per hour/project</p>
                        <p className="pl-4">Payment Schedule: _________________________</p>
                        <p className="mt-4"><strong>3. INTELLECTUAL PROPERTY</strong></p>
                        <p className="pl-4">All work product belongs to: ☐ Client ☐ Freelancer ☐ Shared</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: Project milestones, Payment schedule, IP ownership, Confidentiality]
                        </p>
                      </>
                    )}
                    
                    {/* Property - Rental/Lease */}
                    {previewDocument.category === 'Property' && (previewDocument.title.includes('Rental') || previewDocument.title.includes('Lease') || previewDocument.title.includes('Tenant')) && (
                      <>
                        <p><strong>RESIDENTIAL PROPERTY RENTAL AGREEMENT</strong></p>
                        <p>This Agreement is made on _____ day of _________, 20___</p>
                        <p><strong>BETWEEN:</strong></p>
                        <p className="pl-4">Landlord: _________________________ ("Landlord")</p>
                        <p className="pl-4">Tenant: _________________________ ("Tenant")</p>
                        <p className="mt-4"><strong>1. PROPERTY DESCRIPTION</strong></p>
                        <p className="pl-4">Address: _________________________</p>
                        <p className="pl-4">Type: ☐ Apartment ☐ House ☐ Room</p>
                        <p className="pl-4">Bedrooms: _____ Bathrooms: _____</p>
                        <p className="mt-4"><strong>2. RENTAL TERMS</strong></p>
                        <p className="pl-4">Monthly Rent: KES _________________________</p>
                        <p className="pl-4">Security Deposit: KES _________________________</p>
                        <p className="pl-4">Lease Period: ☐ Monthly ☐ 6 Months ☐ 1 Year</p>
                        <p className="pl-4">Commencement Date: _________________________</p>
                        <p className="mt-4"><strong>3. UTILITIES AND SERVICES</strong></p>
                        <p className="pl-4">Water: ☐ Included ☐ Tenant pays</p>
                        <p className="pl-4">Electricity: ☐ Included ☐ Tenant pays</p>
                        <p className="pl-4">Garbage Collection: ☐ Included ☐ Tenant pays</p>
                        <p className="mt-4"><strong>4. MAINTENANCE AND REPAIRS</strong></p>
                        <p className="pl-4">4.1 Landlord responsible for: Structural repairs...</p>
                        <p className="pl-4">4.2 Tenant responsible for: Day-to-day maintenance...</p>
                        <p className="mt-4"><strong>5. NOTICE PERIOD</strong></p>
                        <p className="pl-4">Termination Notice: _____ days written notice</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: Pet policy, Subletting restrictions, Entry rights, Renewal terms, Dispute resolution]
                        </p>
                      </>
                    )}
                    
                    {/* Property - Land/Construction */}
                    {previewDocument.category === 'Property' && (previewDocument.title.includes('Land') || previewDocument.title.includes('Construction')) && !(previewDocument.title.includes('Rental') || previewDocument.title.includes('Lease')) && (
                      <>
                        <p><strong>LAND SALE AGREEMENT</strong></p>
                        <p>This Agreement is made on _____ day of _________, 20___</p>
                        <p><strong>BETWEEN:</strong></p>
                        <p className="pl-4">Vendor: _________________________ ("Seller")</p>
                        <p className="pl-4">Purchaser: _________________________ ("Buyer")</p>
                        <p className="mt-4"><strong>1. PROPERTY DESCRIPTION</strong></p>
                        <p className="pl-4">Land Reference No: _________________________</p>
                        <p className="pl-4">Location: _________________________ County</p>
                        <p className="pl-4">Size: _________ Acres/Hectares</p>
                        <p className="mt-4"><strong>2. PURCHASE CONSIDERATION</strong></p>
                        <p className="pl-4">Purchase Price: KES _________________________</p>
                        <p className="pl-4">Deposit: KES _________ (payable upon signing)</p>
                        <p className="pl-4">Balance: KES _________ (payable on completion)</p>
                        <p className="mt-4"><strong>3. TITLE TRANSFER</strong></p>
                        <p className="pl-4">3.1 Transfer of ownership within _____ days...</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: Encumbrances, Warranties, Vacant possession, Stamp duty provisions]
                        </p>
                      </>
                    )}
                    
                    {/* Family Law - Divorce */}
                    {previewDocument.category === 'Family Law' && previewDocument.title.includes('Divorce') && (
                      <>
                        <p><strong>DIVORCE PETITION</strong></p>
                        <p className="text-center font-bold mt-2">IN THE HIGH COURT OF KENYA AT _____________</p>
                        <p className="text-center">MATRIMONIAL CAUSE NO. _____ OF 20___</p>
                        <p className="mt-4"><strong>IN THE MATTER OF:</strong></p>
                        <p className="pl-4">Petitioner: _________________________</p>
                        <p className="pl-4">Respondent: _________________________</p>
                        <p className="mt-4"><strong>PETITION FOR DISSOLUTION OF MARRIAGE</strong></p>
                        <p className="mt-4"><strong>GROUNDS FOR DIVORCE:</strong></p>
                        <p className="pl-4">☐ Irretrievable breakdown of marriage</p>
                        <p className="pl-4">☐ Adultery</p>
                        <p className="pl-4">☐ Cruelty</p>
                        <p className="pl-4">☐ Desertion</p>
                        <p className="mt-4"><strong>MATTERS FOR DETERMINATION:</strong></p>
                        <p className="pl-4">1. Custody of children...</p>
                        <p className="pl-4">2. Division of matrimonial property...</p>
                        <p className="pl-4">3. Maintenance and support...</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: Affidavit format, Children's welfare provisions, Property schedules]
                        </p>
                      </>
                    )}
                    
                    {/* Family Law - Prenuptial */}
                    {previewDocument.title.includes('Prenuptial') && (
                      <>
                        <p><strong>PRENUPTIAL AGREEMENT</strong></p>
                        <p>This Agreement is made on _____ day of _________, 20___</p>
                        <p><strong>BETWEEN:</strong></p>
                        <p className="pl-4">Party 1: _________________________ ("First Party")</p>
                        <p className="pl-4">Party 2: _________________________ ("Second Party")</p>
                        <p className="mt-4"><strong>1. SEPARATE PROPERTY</strong></p>
                        <p className="pl-4">Assets owned before marriage remain separate property...</p>
                        <p className="mt-4"><strong>2. MARITAL PROPERTY</strong></p>
                        <p className="pl-4">Assets acquired during marriage: _________________________</p>
                        <p className="mt-4"><strong>3. DEBT ALLOCATION</strong></p>
                        <p className="pl-4">Pre-existing debts remain with respective party...</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: Asset protection, Debt allocation, Inheritance rights, Financial disclosure]
                        </p>
                      </>
                    )}
                    
                    {/* Family Law - Child Custody */}
                    {previewDocument.title.includes('Custody') && (
                      <>
                        <p><strong>CHILD CUSTODY AGREEMENT</strong></p>
                        <p>This Agreement is made on _____ day of _________, 20___</p>
                        <p><strong>BETWEEN:</strong></p>
                        <p className="pl-4">Parent 1: _________________________</p>
                        <p className="pl-4">Parent 2: _________________________</p>
                        <p className="mt-4"><strong>CONCERNING:</strong></p>
                        <p className="pl-4">Child(ren): _________________________</p>
                        <p className="mt-4"><strong>1. CUSTODY ARRANGEMENT</strong></p>
                        <p className="pl-4">Primary Custody: _________________________</p>
                        <p className="pl-4">Visitation Schedule: _________________________</p>
                        <p className="mt-4"><strong>2. CHILD SUPPORT</strong></p>
                        <p className="pl-4">Monthly Support: KES _________________________</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: Holiday schedules, Education decisions, Healthcare, Travel permissions]
                        </p>
                      </>
                    )}
                    
                    {/* Corporate - Partnership */}
                    {previewDocument.category === 'Corporate' && previewDocument.title.includes('Partnership') && (
                      <>
                        <p><strong>PARTNERSHIP DEED</strong></p>
                        <p>This Partnership Agreement is made on _____ day of _________, 20___</p>
                        <p><strong>BETWEEN:</strong></p>
                        <p className="pl-4">Partner 1: _________________________ (____%)</p>
                        <p className="pl-4">Partner 2: _________________________ (____%)</p>
                        <p className="mt-4"><strong>1. BUSINESS NAME AND PURPOSE</strong></p>
                        <p className="pl-4">Name: _________________________</p>
                        <p className="pl-4">Nature: _________________________</p>
                        <p className="mt-4"><strong>2. CAPITAL CONTRIBUTION</strong></p>
                        <p className="pl-4">Partner 1: KES _________________________</p>
                        <p className="pl-4">Partner 2: KES _________________________</p>
                        <p className="mt-4"><strong>3. PROFIT AND LOSS SHARING</strong></p>
                        <p className="pl-4">Profits/Losses shared in ratio: _____ : _____</p>
                        <p className="mt-4"><strong>4. MANAGEMENT</strong></p>
                        <p className="pl-4">4.1 Day-to-day decisions: Mutual consent</p>
                        <p className="pl-4">4.2 Major decisions: Unanimous agreement...</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: Banking arrangements, Dissolution terms, Dispute resolution, Admission of new partners]
                        </p>
                      </>
                    )}
                    
                    {/* Corporate - NDA */}
                    {previewDocument.title.includes('NDA') || previewDocument.title.includes('Non-Disclosure') && (
                      <>
                        <p><strong>NON-DISCLOSURE AGREEMENT</strong></p>
                        <p>This Agreement is made on _____ day of _________, 20___</p>
                        <p><strong>BETWEEN:</strong></p>
                        <p className="pl-4">Disclosing Party: _________________________</p>
                        <p className="pl-4">Receiving Party: _________________________</p>
                        <p className="mt-4"><strong>1. CONFIDENTIAL INFORMATION</strong></p>
                        <p className="pl-4">All information shared including: Trade secrets, business plans...</p>
                        <p className="mt-4"><strong>2. OBLIGATIONS</strong></p>
                        <p className="pl-4">2.1 Receiving party shall not disclose...</p>
                        <p className="pl-4">2.2 Information shall be used solely for...</p>
                        <p className="mt-4"><strong>3. DURATION</strong></p>
                        <p className="pl-4">This agreement remains in effect for _____ years</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: Enforceable in Kenya, Mutual or unilateral, Customizable duration, Penalty clauses]
                        </p>
                      </>
                    )}
                    
                    {/* Transport - Car Hire Agreement */}
                    {previewDocument.title.includes('Car Hire') && (
                      <>
                        <p><strong>CAR HIRE AGREEMENT</strong></p>
                        <p>This Agreement is made on _____ day of _________, 20___</p>
                        <p><strong>BETWEEN:</strong></p>
                        <p className="pl-4">Car Hire Company: _________________________ ("Owner")</p>
                        <p className="pl-4">Address: _________________________</p>
                        <p className="pl-4">Hirer: _________________________ ("Hirer")</p>
                        <p className="pl-4">ID/Passport No: _________________________</p>
                        <p className="pl-4">Driving License No: _________________________</p>
                        <p className="mt-4"><strong>1. VEHICLE DETAILS</strong></p>
                        <p className="pl-4">Make/Model: _________________________</p>
                        <p className="pl-4">Registration Number: _________________________</p>
                        <p className="pl-4">Year of Manufacture: _________________________</p>
                        <p className="pl-4">Color: _________________________</p>
                        <p className="pl-4">Condition at handover: ☐ Excellent ☐ Good ☐ Fair</p>
                        <p className="mt-4"><strong>2. RENTAL PERIOD AND CHARGES</strong></p>
                        <p className="pl-4">Pick-up Date/Time: _________________________</p>
                        <p className="pl-4">Return Date/Time: _________________________</p>
                        <p className="pl-4">Daily Rate: KES _________</p>
                        <p className="pl-4">Weekly Rate: KES _________</p>
                        <p className="pl-4">Monthly Rate: KES _________</p>
                        <p className="pl-4">Total Rental: KES _________________________</p>
                        <p className="mt-4"><strong>3. SECURITY DEPOSIT</strong></p>
                        <p className="pl-4">Security Deposit: KES _________________________</p>
                        <p className="pl-4">Refundable upon satisfactory return of vehicle</p>
                        <p className="mt-4"><strong>4. INSURANCE COVERAGE</strong></p>
                        <p className="pl-4">☐ Comprehensive Insurance Included</p>
                        <p className="pl-4">☐ Third Party Only</p>
                        <p className="pl-4">Excess Amount: KES _________________________</p>
                        <p className="pl-4">Insurance Certificate No: _________________________</p>
                        <p className="mt-4"><strong>5. MILEAGE AND FUEL</strong></p>
                        <p className="pl-4">Mileage Limit: _________ km per day</p>
                        <p className="pl-4">Excess Mileage Charge: KES _____ per km</p>
                        <p className="pl-4">Fuel Policy: ☐ Full-to-Full ☐ Pre-paid ☐ Pay as you use</p>
                        <p className="pl-4">Current Fuel Level: _________________________</p>
                        <p className="mt-4"><strong>6. PERMITTED USE</strong></p>
                        <p className="pl-4">6.1 Vehicle to be used within Kenya only</p>
                        <p className="pl-4">6.2 Only licensed drivers permitted</p>
                        <p className="pl-4">6.3 No off-road driving or racing</p>
                        <p className="pl-4">6.4 No subletting or unauthorized use</p>
                        <p className="mt-4"><strong>7. HIRER'S RESPONSIBILITIES</strong></p>
                        <p className="pl-4">7.1 Maintain vehicle in good condition</p>
                        <p className="pl-4">7.2 Report accidents/damage immediately</p>
                        <p className="pl-4">7.3 Pay all traffic fines incurred</p>
                        <p className="pl-4">7.4 Lock vehicle when unattended</p>
                        <p className="mt-4"><strong>8. DAMAGE AND LIABILITY</strong></p>
                        <p className="pl-4">Hirer liable for: Accidents, theft, damage beyond normal wear</p>
                        <p className="pl-4">Repair costs deductible from security deposit</p>
                        <p className="mt-4"><strong>9. LATE RETURN CHARGES</strong></p>
                        <p className="pl-4">Late fee: KES _____ per hour after grace period</p>
                        <p className="pl-4">Grace period: _____ minutes</p>
                        <p className="mt-4"><strong>10. TERMINATION</strong></p>
                        <p className="pl-4">Owner may repossess if: Payment default, misuse, damage</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: Pre-inspection checklist, Damage assessment form, Police report procedures, NTSA compliance, Road-worthy certificate]
                        </p>
                      </>
                    )}
                    
                    {/* Employment - Domestic Worker */}
                    {previewDocument.title.includes('Domestic Worker') && (
                      <>
                        <p><strong>DOMESTIC WORKER EMPLOYMENT CONTRACT</strong></p>
                        <p>This Agreement is made on _____ day of _________, 20___</p>
                        <p><strong>BETWEEN:</strong></p>
                        <p className="pl-4">Employer: _________________________ ("Employer")</p>
                        <p className="pl-4">Address: _________________________</p>
                        <p className="pl-4">Employee: _________________________ ("Worker")</p>
                        <p className="pl-4">ID No: _________________________</p>
                        <p className="mt-4"><strong>1. POSITION AND DUTIES</strong></p>
                        <p className="pl-4">Position: ☐ House Help ☐ Gardener ☐ Security Guard ☐ Cook ☐ Nanny</p>
                        <p className="pl-4">Duties: _________________________</p>
                        <p className="mt-4"><strong>2. SALARY AND BENEFITS</strong></p>
                        <p className="pl-4">Monthly Salary: KES _________________________</p>
                        <p className="pl-4">Accommodation: ☐ Provided ☐ Not Provided</p>
                        <p className="pl-4">Meals: ☐ Provided ☐ Allowance KES _____</p>
                        <p className="pl-4">NSSF: ☐ Employer pays ☐ Shared</p>
                        <p className="pl-4">NHIF: ☐ Employer pays ☐ Worker pays</p>
                        <p className="mt-4"><strong>3. WORKING HOURS</strong></p>
                        <p className="pl-4">Start Time: _____ End Time: _____</p>
                        <p className="pl-4">Rest Days: _________________________</p>
                        <p className="pl-4">Overtime Rate: KES _____ per hour</p>
                        <p className="mt-4"><strong>4. LEAVE ENTITLEMENT</strong></p>
                        <p className="pl-4">Annual Leave: 21 days per year</p>
                        <p className="pl-4">Sick Leave: As per Labour Laws</p>
                        <p className="pl-4">Maternity Leave: 3 months (if applicable)</p>
                        <p className="mt-4"><strong>5. TERMINATION</strong></p>
                        <p className="pl-4">Notice Period: _____ days written notice</p>
                        <p className="pl-4">Grounds for termination: Misconduct, theft, neglect...</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: NSSF/NHIF registration guide, Service gratuity, Disciplinary procedure, Reference letter template]
                        </p>
                      </>
                    )}
                    
                    {/* Catering Agreement */}
                    {previewDocument.title.includes('Catering') && (
                      <>
                        <p><strong>CATERING SERVICES AGREEMENT</strong></p>
                        <p>This Agreement is made on _____ day of _________, 20___</p>
                        <p><strong>BETWEEN:</strong></p>
                        <p className="pl-4">Caterer: _________________________ ("Service Provider")</p>
                        <p className="pl-4">Client: _________________________ ("Client")</p>
                        <p className="mt-4"><strong>EVENT DETAILS:</strong></p>
                        <p className="pl-4">Event Type: ☐ Wedding ☐ Corporate ☐ Birthday ☐ Other: _____</p>
                        <p className="pl-4">Date: _________________________ Time: _____</p>
                        <p className="pl-4">Venue: _________________________</p>
                        <p className="pl-4">Number of Guests: _________________________</p>
                        <p className="mt-4"><strong>1. MENU AND SERVICES</strong></p>
                        <p className="pl-4">Menu Package: _________________________</p>
                        <p className="pl-4">☐ Appetizers ☐ Main Course ☐ Dessert ☐ Drinks</p>
                        <p className="pl-4">Special Dietary Requirements: _________________________</p>
                        <p className="mt-4"><strong>2. PRICING</strong></p>
                        <p className="pl-4">Price per Person: KES _________________________</p>
                        <p className="pl-4">Total Package Cost: KES _________________________</p>
                        <p className="pl-4">Additional Services: KES _________________________</p>
                        <p className="pl-4">☐ Waiters/Servers ☐ Equipment Rental ☐ Decor</p>
                        <p className="mt-4"><strong>3. PAYMENT TERMS</strong></p>
                        <p className="pl-4">Deposit (50%): KES _____ Due: _____</p>
                        <p className="pl-4">Balance (50%): KES _____ Due: 3 days before event</p>
                        <p className="mt-4"><strong>4. CANCELLATION POLICY</strong></p>
                        <p className="pl-4">30+ days: Full refund less 10%</p>
                        <p className="pl-4">14-29 days: 50% refund</p>
                        <p className="pl-4">Less than 14 days: No refund</p>
                        <p className="mt-4"><strong>5. CATERER'S OBLIGATIONS</strong></p>
                        <p className="pl-4">5.1 Food safety and hygiene standards</p>
                        <p className="pl-4">5.2 Timely setup and service</p>
                        <p className="pl-4">5.3 Professional staff and presentation</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: Menu tasting options, Equipment list, Staff ratio, Food safety certificates, Liability insurance]
                        </p>
                      </>
                    )}
                    
                    {/* Financial - Guarantee */}
                    {previewDocument.title.includes('Guarantee') && (
                      <>
                        <p><strong>GUARANTEE AGREEMENT</strong></p>
                        <p>This Agreement is made on _____ day of _________, 20___</p>
                        <p><strong>PARTIES:</strong></p>
                        <p className="pl-4">Lender: _________________________ ("Creditor")</p>
                        <p className="pl-4">Borrower: _________________________ ("Principal Debtor")</p>
                        <p className="pl-4">Guarantor: _________________________ ("Guarantor")</p>
                        <p className="pl-4">Guarantor ID: _________________________</p>
                        <p className="mt-4"><strong>1. GUARANTEE DETAILS</strong></p>
                        <p className="pl-4">Principal Loan Amount: KES _________________________</p>
                        <p className="pl-4">Maximum Liability: KES _________________________</p>
                        <p className="pl-4">Guarantee Type: ☐ Full ☐ Limited ☐ Continuing</p>
                        <p className="mt-4"><strong>2. GUARANTOR'S OBLIGATIONS</strong></p>
                        <p className="pl-4">2.1 Pay all amounts due if borrower defaults</p>
                        <p className="pl-4">2.2 Liable for principal, interest, and costs</p>
                        <p className="pl-4">2.3 Cannot dispute validity of underlying debt</p>
                        <p className="mt-4"><strong>3. SECURITY PROVIDED</strong></p>
                        <p className="pl-4">Collateral: _________________________</p>
                        <p className="pl-4">Title Deed No: _________________________</p>
                        <p className="mt-4"><strong>4. RELEASE CONDITIONS</strong></p>
                        <p className="pl-4">Guarantee released upon: Full loan repayment</p>
                        <p className="pl-4">Written confirmation from lender required</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Includes: Joint guarantee provisions, Call procedures, Legal fees, Indemnity clauses, Asset disclosure]
                        </p>
                      </>
                    )}
                    
                    {/* Generic fallback - only if no other match */}
                    {!previewDocument.title.includes('Employment') && 
                     !previewDocument.title.includes('Freelance') &&
                     !previewDocument.title.includes('Domestic Worker') &&
                     !previewDocument.title.includes('Rental') && 
                     !previewDocument.title.includes('Lease') && 
                     !previewDocument.title.includes('Tenant') &&
                     !previewDocument.title.includes('Bedsitter') &&
                     !previewDocument.title.includes('Land') && 
                     !previewDocument.title.includes('Construction') &&
                     !previewDocument.title.includes('Divorce') && 
                     !previewDocument.title.includes('Prenuptial') &&
                     !previewDocument.title.includes('Custody') &&
                     !previewDocument.title.includes('Travel') &&
                     !previewDocument.title.includes('Partnership') &&
                     !previewDocument.title.includes('NDA') &&
                     !previewDocument.title.includes('Non-Disclosure') &&
                     !previewDocument.title.includes('Car Hire') &&
                     !previewDocument.title.includes('Catering') &&
                     !previewDocument.title.includes('Guarantee') && (
                      <>
                        <p><strong>THIS AGREEMENT</strong> is made on the _____ day of _________, 20___</p>
                        <p><strong>BETWEEN:</strong></p>
                        <p className="pl-4">Party 1: _________________________ (hereinafter referred to as "Party A")</p>
                        <p className="pl-4">Party 2: _________________________ (hereinafter referred to as "Party B")</p>
                        <p className="mt-4"><strong>WHEREAS:</strong></p>
                        <p className="pl-4">1. The parties wish to enter into this agreement...</p>
                        <p className="pl-4">2. This document is legally binding under Kenyan law...</p>
                        <p className="mt-4 text-slate-500 italic text-xs">
                          [Preview continues with full legal clauses, terms, conditions, and schedules in the purchased version]
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600 mt-4 text-center">
                  ⚠️ This is a simplified preview. The full document includes comprehensive legal clauses, 
                  detailed terms, and customizable sections ready for your use.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 px-8 py-6 bg-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500 mb-1">One-time payment</p>
                  <p className="text-3xl font-bold text-slate-900">KES {previewDocument.price.toLocaleString()}</p>
                  <p className="text-xs text-slate-500 mt-1">Instant download • Lifetime access • Free updates</p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setPreviewDocument(null)}
                    className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition"
                  >
                    Close Preview
                  </button>
                  <button
                    onClick={() => {
                      setPreviewDocument(null);
                      handlePurchaseDocument(previewDocument.id, previewDocument.title);
                    }}
                    className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
                  >
                    Purchase Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
