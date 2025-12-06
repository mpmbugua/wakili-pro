import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, HelpCircle, MessageSquare, Phone, Mail } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  // General Questions
  {
    category: 'General',
    question: 'What is Wakili Pro?',
    answer: 'Wakili Pro is Kenya\'s leading legal technology platform that connects clients with verified lawyers, provides AI-powered legal assistance, and offers a comprehensive marketplace of legal documents and services. We make legal services accessible, affordable, and transparent for everyone.'
  },
  {
    category: 'General',
    question: 'How does Wakili Pro work?',
    answer: 'Simply create a free account, browse our services (consultations, documents, AI assistance), select what you need, and pay securely via M-Pesa. For consultations, you\'ll be connected with a verified lawyer. For documents, you can download templates or request custom drafting. Our AI assistant is available 24/7 for quick legal questions.'
  },
  {
    category: 'General',
    question: 'Is Wakili Pro available across Kenya?',
    answer: 'Yes! Wakili Pro operates nationwide across all 47 counties. Our platform connects you with lawyers in your area, and many services (like video consultations and document downloads) can be accessed from anywhere in Kenya.'
  },

  // Lawyers
  {
    category: 'Lawyers',
    question: 'Are the lawyers on Wakili Pro verified?',
    answer: 'Absolutely. Every lawyer on our platform is verified by the Law Society of Kenya. We check their practicing certificates, professional indemnity insurance, and credentials before approval. You can view each lawyer\'s verification badge, specializations, and client reviews.'
  },
  {
    category: 'Lawyers',
    question: 'How do I choose the right lawyer?',
    answer: 'Use our filters to search by specialization (e.g., family law, corporate law), location, rating, and hourly rate. Read lawyer profiles to see their experience, education, and client reviews. You can also describe your legal issue to our AI assistant for personalized lawyer recommendations.'
  },
  {
    category: 'Lawyers',
    question: 'Can I meet lawyers in person or only online?',
    answer: 'Both options are available! You can book video consultations, phone calls, or request in-person meetings. When booking, specify your preference, and the lawyer will confirm availability. In-person meetings are subject to the lawyer\'s office location and schedule.'
  },
  {
    category: 'Lawyers',
    question: 'What if I\'m not satisfied with a lawyer\'s service?',
    answer: 'We take quality seriously. If you\'re unsatisfied, contact our support team within 48 hours with details. We\'ll mediate the issue and, if warranted, issue a partial or full refund. Lawyers with repeated complaints may be removed from the platform.'
  },

  // Consultations
  {
    category: 'Consultations',
    question: 'How much does a consultation cost?',
    answer: 'Consultation fees are set by individual lawyers and typically range from KES 2,000 to KES 10,000 per hour, depending on the lawyer\'s experience and specialization. You\'ll see the exact price before booking. Payment is upfront via M-Pesa.'
  },
  {
    category: 'Consultations',
    question: 'What is the difference between immediate and scheduled bookings?',
    answer: 'Immediate bookings allow you to request a consultation right away—the lawyer responds within 30 minutes to confirm availability. Scheduled bookings let you pick a specific date and time for the consultation, with the lawyer also confirming within 30 minutes.'
  },
  {
    category: 'Consultations',
    question: 'What happens if the lawyer doesn\'t confirm my booking?',
    answer: 'If a lawyer doesn\'t respond within 30 minutes, our system automatically recommends 3 alternative lawyers with similar expertise and availability. You can select any recommended lawyer and rebook at no additional charge. If you prefer not to rebook, you can request a full refund instead.'
  },
  {
    category: 'Consultations',
    question: 'Can I get a refund if I cancel my consultation?',
    answer: 'Cancellation policies vary: If you cancel more than 24 hours before the scheduled time, you get a full refund. Cancellations within 24 hours receive a 50% refund. No-shows (you don\'t attend) are non-refundable.'
  },

  // Documents
  {
    category: 'Documents',
    question: 'What types of documents are available?',
    answer: 'We offer 500+ legal document templates including tenancy agreements, employment contracts, sale agreements, wills, partnership deeds, NDAs, and more. Documents are drafted by qualified lawyers and comply with Kenyan law.'
  },
  {
    category: 'Documents',
    question: 'Are the documents legally valid?',
    answer: 'Yes. All templates are prepared by licensed Kenyan lawyers and updated to reflect current laws. However, for complex matters or high-value transactions, we recommend having a lawyer review and customize the document for your specific situation.'
  },
  {
    category: 'Documents',
    question: 'Can I customize a document after purchase?',
    answer: 'Most templates are editable Word documents that you can customize. For professional customization, you can request our document review service (KES 500 for AI review, KES 2,000+ for lawyer certification).'
  },
  {
    category: 'Documents',
    question: 'What is the difference between AI review and lawyer certification?',
    answer: 'AI review (KES 500) provides instant analysis of your document for common issues, compliance gaps, and risks. Lawyer certification (KES 2,000+) involves a qualified lawyer thoroughly reviewing, customizing, and digitally signing your document. Both are delivered within 2 hours.'
  },
  {
    category: 'Documents',
    question: 'Can I get a refund for a document purchase?',
    answer: 'Due to the digital nature of documents, refunds are not available after download unless the document is defective or substantially different from the description. If you encounter issues, contact support immediately.'
  },

  // Payments
  {
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer: 'We primarily use M-Pesa for secure, instant payments. Simply enter your M-Pesa phone number (254XXXXXXXXX format), and you\'ll receive an STK push prompt on your phone. Complete the payment, and your service is activated immediately.'
  },
  {
    category: 'Payments',
    question: 'Is my payment information secure?',
    answer: 'Absolutely. We use bank-level encryption and comply with PCI-DSS standards. M-Pesa payments are processed directly by Safaricom—we never store your M-Pesa PIN or sensitive payment details.'
  },
  {
    category: 'Payments',
    question: 'When will I be charged?',
    answer: 'Payment is required upfront before services are delivered. For consultations, you pay when booking. For documents, you pay before download. For service requests, you pay a KES 500 commitment fee to receive quotes, then 30% upfront when you select a lawyer.'
  },
  {
    category: 'Payments',
    question: 'How do refunds work?',
    answer: 'Refunds are processed back to your M-Pesa account within 3-5 business days. You\'ll receive an SMS notification when the refund is initiated and when it\'s completed. Refund eligibility depends on the service type and cancellation timing.'
  },

  // Service Requests
  {
    category: 'Service Requests',
    question: 'What is a service request?',
    answer: 'Service requests are for comprehensive legal services like company registration, land conveyancing, divorce proceedings, etc. You describe your needs, pay KES 500, and receive up to 3 customized quotes from verified lawyers within 12 hours.'
  },
  {
    category: 'Service Requests',
    question: 'How does the 30% upfront payment work?',
    answer: 'After selecting a lawyer\'s quote, you pay 30% of the total quoted amount upfront. This is split: 20% goes to Wakili Pro as a platform commission, and 10% goes to the lawyer as an escrow to begin work. You pay the remaining 70% as the case progresses.'
  },
  {
    category: 'Service Requests',
    question: 'What if no lawyer responds to my service request?',
    answer: 'If you don\'t receive at least one quote within 48 hours, your KES 500 commitment fee is automatically refunded. We also proactively notify lawyers matching your requirements to ensure you get responses.'
  },

  // AI Assistant
  {
    category: 'AI Assistant',
    question: 'What can the AI assistant help me with?',
    answer: 'Our AI assistant can answer general legal questions, explain Kenyan laws, guide you through legal processes, recommend relevant documents, and suggest when you need a lawyer. It\'s trained on Kenyan legal statutes and common legal issues.'
  },
  {
    category: 'AI Assistant',
    question: 'Is the AI assistant\'s advice legally binding?',
    answer: 'No. The AI provides general information and guidance only. It does not constitute legal advice and should not be relied upon for specific legal matters. For personalized advice, always consult a licensed lawyer through our platform.'
  },
  {
    category: 'AI Assistant',
    question: 'Is the AI assistant free to use?',
    answer: 'Yes! Our AI legal assistant is completely free and available 24/7 to all users. No account required for basic questions, though creating an account unlocks personalized features and chat history.'
  },

  // Account & Privacy
  {
    category: 'Account & Privacy',
    question: 'Do I need an account to use Wakili Pro?',
    answer: 'You can browse lawyers, documents, and use the AI assistant without an account. However, to book consultations, purchase documents, or submit service requests, you\'ll need to create a free account.'
  },
  {
    category: 'Account & Privacy',
    question: 'Is my information confidential?',
    answer: 'Yes. We comply with Kenya\'s Data Protection Act, 2019. Your personal information is encrypted and never shared without consent. Lawyers only see information relevant to your case. Read our Privacy Policy for full details.'
  },
  {
    category: 'Account & Privacy',
    question: 'Can I delete my account?',
    answer: 'Yes. Go to Settings > Account > Delete Account. Your data will be permanently deleted within 90 days, except where we\'re legally required to retain it (e.g., for tax or legal compliance).'
  },

  // For Lawyers
  {
    category: 'For Lawyers',
    question: 'How can I join Wakili Pro as a lawyer?',
    answer: 'Click "Join as Lawyer" on the homepage, complete the application form, and upload your practicing certificate, ID, and professional indemnity insurance. Our team reviews applications within 3-5 business days. Once approved, you can start accepting clients immediately.'
  },
  {
    category: 'For Lawyers',
    question: 'How much does Wakili Pro charge lawyers?',
    answer: 'We offer two subscription tiers: LITE (KES 2,999/month) for basic features, and PRO (KES 4,999/month) for unlimited bookings and priority placement. Additionally, we charge a 20% commission on service request payments. No hidden fees.'
  },
  {
    category: 'For Lawyers',
    question: 'How do I get paid?',
    answer: 'Payments are deposited into your Wakili Pro wallet immediately after service delivery. You can withdraw funds to your M-Pesa or bank account anytime. Withdrawals under KES 50,000 are processed within 24 hours.'
  },
];

const categories = ['All', 'General', 'Lawyers', 'Consultations', 'Documents', 'Payments', 'Service Requests', 'AI Assistant', 'Account & Privacy', 'For Lawyers'];

export const FAQPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const filteredFAQs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Find answers to common questions about Wakili Pro's services, pricing, and processes.
          </p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-blue-100 text-blue-700 shadow-md'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-blue-300 hover:bg-blue-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* FAQ List */}
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredFAQs.length > 0 ? (
            filteredFAQs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg shadow-md border border-slate-200 overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex-1">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded mb-2">
                      {faq.category}
                    </span>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {faq.question}
                    </h3>
                  </div>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-slate-400 flex-shrink-0 ml-4" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400 flex-shrink-0 ml-4" />
                  )}
                </button>
                
                {openIndex === index && (
                  <div className="px-6 pb-4 pt-2 border-t border-slate-100">
                    <p className="text-slate-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">No FAQs found matching your search.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('All'); }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Still Have Questions */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4 text-center">Still have questions?</h2>
            <p className="text-center text-blue-100 mb-6">
              Our support team is here to help you. Get in touch and we'll respond within 24 hours.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <a
                href="/contact"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold text-center hover:bg-blue-50 transition-colors flex items-center justify-center"
              >
                <Mail className="h-5 w-5 mr-2" />
                Email Us
              </a>
              <a
                href="/ai"
                className="bg-white/10 backdrop-blur text-white border-2 border-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                Ask AI Assistant
              </a>
              <a
                href="tel:+254700000000"
                className="bg-white/10 backdrop-blur text-white border-2 border-white px-6 py-3 rounded-lg font-semibold text-center hover:bg-white/20 transition-colors flex items-center justify-center"
              >
                <Phone className="h-5 w-5 mr-2" />
                Call Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
