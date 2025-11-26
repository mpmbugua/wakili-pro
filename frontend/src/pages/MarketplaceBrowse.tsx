import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';

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
  const [purchasingDocument, setPurchasingDocument] = useState<Document | null>(null);

  // Check for pending purchase after login/registration
  useEffect(() => {
    const pendingPurchase = sessionStorage.getItem('pendingPurchase');
    if (pendingPurchase && isAuthenticated) {
      try {
        const { docId } = JSON.parse(pendingPurchase);
        const doc = sampleDocuments.find(d => d.id === docId);
        if (doc) {
          // Auto-trigger purchase for this document
          setPurchasingDocument(doc);
          sessionStorage.removeItem('pendingPurchase');
        }
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

  const handlePurchaseDocument = (docId: string, docTitle: string) => {
    if (!isAuthenticated) {
      sessionStorage.setItem('pendingPurchase', JSON.stringify({ docId, docTitle }));
      navigate('/login', { state: { from: '/marketplace', message: 'Please log in to purchase documents' } });
    } else {
      // Find the document and show purchase confirmation
      const doc = sampleDocuments.find(d => d.id === docId);
      if (doc) {
        setPurchasingDocument(doc);
      }
    }
  };

  return (
    <GlobalLayout>
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
                    {previewDocument.category === 'Employment' && (
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
                    {previewDocument.category === 'Property' && (
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
                    {previewDocument.category === 'Family Law' && (
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
                    {previewDocument.category === 'Corporate' && (
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
                    {!['Employment', 'Property', 'Family Law', 'Corporate'].includes(previewDocument.category) && (
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

      {/* Purchase Confirmation Modal */}
      {purchasingDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Confirm Purchase</h3>
            <div className="mb-6">
              <p className="text-slate-700 font-medium mb-2">{purchasingDocument.title}</p>
              <p className="text-sm text-slate-600 mb-4">{purchasingDocument.description}</p>
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-slate-600">Document Price</span>
                  <span className="font-semibold text-slate-900">KES {purchasingDocument.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Format</span>
                  <span className="font-semibold text-slate-900">{purchasingDocument.format}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 text-center">
                You will be redirected to M-Pesa payment to complete your purchase
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setPurchasingDocument(null)}
                className="flex-1 px-4 py-3 border-2 border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // For now, show an alert. In production, this would initiate the actual purchase flow
                  alert(`Purchase flow for "${purchasingDocument.title}" would be initiated here.\n\nThis is a demo marketplace. In production, you would be redirected to the M-Pesa payment page.`);
                  setPurchasingDocument(null);
                }}
                className="flex-1 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
              >
                Pay with M-Pesa
              </button>
            </div>
          </div>
        </div>
      )}
    </GlobalLayout>
  );
};
