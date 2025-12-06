import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Book, FileText, Video, HelpCircle, ArrowRight } from 'lucide-react';
import axiosInstance from '../lib/axios';

interface Article {
  id: string;
  title: string;
  content: string;
  authorId: string;
  User?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  metadata?: {
    aiSummary?: string;
    category?: string;
    tags?: string[];
    qualityScore?: number;
    source?: string;
  };
}

export const ResourcesPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get('/articles/published?limit=6');
      
      if (response.data.success) {
        setArticles(response.data.data.articles || []);
      } else {
        // No error if no articles yet - just show empty state
        setArticles([]);
      }
    } catch (err) {
      console.error('Error fetching articles:', err);
      // Don't set error - just show empty state gracefully
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  const legalGuides = articles.map(article => ({
    id: article.id,
    title: article.title,
    description: article.metadata?.aiSummary || article.content.substring(0, 150) + '...',
    category: article.metadata?.category || 'Legal',
    readTime: `${Math.ceil(article.content.length / 1000)} min read`,
    link: `/blog#${article.id}`,
    authorId: article.authorId,
    authorName: article.User ? `${article.User.firstName} ${article.User.lastName}` : 'Wakili Pro'
  }));

  const faqs = [
    {
      question: "How do I file a case in a Kenyan court?",
      answer: "Filing a case involves preparing court documents, paying filing fees, and serving the defendant. Consult our AI assistant or book a lawyer for specific guidance."
    },
    {
      question: "What is the cost of hiring a lawyer in Kenya?",
      answer: "Legal fees vary based on case complexity. Consultations typically range from KES 2,000-10,000. Use our marketplace to compare lawyer rates."
    },
    {
      question: "How long does it take to register a company?",
      answer: "Company registration via eCitizen typically takes 7-14 days. Our lawyers can expedite the process and ensure compliance."
    },
    {
      question: "Can I represent myself in court?",
      answer: "Yes, you have the right to self-representation. However, complex cases benefit from professional legal representation."
    }
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
        <div className="max-w-6xl mx-auto text-center px-4 sm:px-6">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">
            Legal Resources & Guides
          </h1>
          <p className="text-sm text-slate-600">
            Free legal information, guides, and FAQs to help you understand Kenyan law
          </p>
        </div>
      </section>

      {/* Legal Guides */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Legal Guides</h2>
          <Book className="h-6 w-6 text-blue-600" />
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-sm text-slate-600">Loading articles...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button 
              onClick={fetchArticles}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(legalGuides.length > 0 ? legalGuides : [
              {
                id: 'sample-1',
                title: 'Understanding the New Data Protection Act in Kenya',
                description: 'Kenya\'s Data Protection Act, 2019 has transformed how businesses handle personal information. Learn about compliance requirements, penalties for violations, and best practices for protecting customer data in the digital age.',
                category: 'Corporate Law',
                readTime: '8 min read',
                link: '/blog'
              },
              {
                id: 'sample-2',
                title: 'Land Ownership Rights: What Property Buyers Should Know',
                description: 'Avoid costly mistakes when purchasing land in Kenya. This comprehensive guide covers title searches, land control board consent, encumbrances, and the complete conveyancing process from offer to registration.',
                category: 'Property Law',
                readTime: '10 min read',
                link: '/blog'
              },
              {
                id: 'sample-3',
                title: 'Employment Contracts in Kenya: Essential Clauses',
                description: 'Protect your rights and obligations with a comprehensive employment contract. Learn about statutory requirements under the Employment Act, probation periods, termination clauses, and non-compete agreements.',
                category: 'Employment Law',
                readTime: '7 min read',
                link: '/blog'
              },
              {
                id: 'sample-4',
                title: 'Company Registration in Kenya: Complete Guide',
                description: 'Starting a business? Learn the complete process of registering a limited company in Kenya, from name reservation to obtaining your certificate of incorporation and tax compliance certificates.',
                category: 'Corporate Law',
                readTime: '9 min read',
                link: '/blog'
              },
              {
                id: 'sample-5',
                title: 'Wills and Estate Planning in Kenya',
                description: 'Don\'t leave your family\'s future to chance. Learn how to draft a valid will, appoint executors, minimize inheritance disputes, and navigate succession law in Kenya.',
                category: 'Family Law',
                readTime: '10 min read',
                link: '/blog'
              },
              {
                id: 'sample-6',
                title: 'Tenancy Agreements: Rights and Obligations',
                description: 'Avoid rental disputes by understanding your legal rights. This guide covers deposit protection, rent increases, eviction procedures, and dispute resolution under the Landlord and Tenant Act.',
                category: 'Property Law',
                readTime: '8 min read',
                link: '/blog'
              }
            ]).map((guide) => (
              <div key={guide.id} className="bg-white rounded-lg border border-slate-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-600 text-xs font-semibold rounded-full mb-3">
                    {guide.category}
                  </span>
                  <h3 className="text-base font-semibold text-slate-900 mb-2">{guide.title}</h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">{guide.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500">{guide.readTime}</span>
                      {guide.authorName && guide.authorId && (
                        <Link 
                          to={`/lawyers/${guide.authorId}`}
                          className="text-xs text-blue-600 hover:text-blue-700 mt-1"
                        >
                          By {guide.authorName}
                        </Link>
                      )}
                    </div>
                    <Link 
                      to={guide.link} 
                      className="text-blue-600 text-sm font-semibold hover:text-blue-700 inline-flex items-center transition-colors"
                    >
                      Read More
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FAQs */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Frequently Asked Questions</h2>
          <HelpCircle className="h-6 w-6 text-blue-600" />
        </div>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-lg border border-slate-200">
              <div className="p-6">
                <h3 className="text-base font-semibold text-slate-900 mb-2">{faq.question}</h3>
                <p className="text-sm text-slate-600">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <p className="text-sm text-slate-600 mb-4">Have more questions?</p>
          <Link to="/ai" className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors">
            Ask Our AI Assistant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8 rounded-lg border border-blue-200 text-center">
          <h2 className="text-lg font-semibold mb-3 text-slate-900">
            Need Personalized Legal Advice?
          </h2>
          <p className="text-sm text-slate-600 mb-6 max-w-2xl mx-auto">
            These guides provide general information. For advice specific to your situation, consult with a qualified lawyer.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link to="/lawyers" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold">
              Find a Lawyer
            </Link>
            <Link to="/marketplace" className="bg-white text-slate-900 px-6 py-3 rounded-lg hover:bg-slate-50 transition-colors text-sm font-semibold border border-slate-300">
              Browse Documents
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
