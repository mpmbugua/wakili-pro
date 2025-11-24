import React from 'react';
import { Link } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { Book, FileText, Video, HelpCircle, ArrowRight } from 'lucide-react';

export const ResourcesPage: React.FC = () => {
  const legalGuides = [
    {
      title: "Understanding Kenyan Employment Law",
      description: "A comprehensive guide to employee rights, contracts, and dismissal procedures under the Employment Act 2007.",
      category: "Employment",
      readTime: "15 min read",
      link: "#"
    },
    {
      title: "Starting a Business in Kenya",
      description: "Step-by-step guide to registering your business, understanding tax obligations, and legal compliance requirements.",
      category: "Business",
      readTime: "20 min read",
      link: "#"
    },
    {
      title: "Land & Property Rights in Kenya",
      description: "Everything you need to know about land ownership, title transfers, and property disputes in Kenya.",
      category: "Property",
      readTime: "18 min read",
      link: "#"
    },
    {
      title: "Family Law Essentials",
      description: "Guide to marriage, divorce, child custody, and succession law in Kenya.",
      category: "Family",
      readTime: "12 min read",
      link: "#"
    },
    {
      title: "Criminal Law & Your Rights",
      description: "Understanding your rights when arrested, bail procedures, and criminal defense in Kenya.",
      category: "Criminal",
      readTime: "10 min read",
      link: "#"
    },
    {
      title: "Traffic Offenses & Motor Vehicle Law",
      description: "Complete guide to traffic laws, NTSA procedures, and handling road accidents in Kenya.",
      category: "Traffic",
      readTime: "8 min read",
      link: "#"
    }
  ];

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
    <GlobalLayout>
      {/* Hero Section */}
      <section className="bg-white border-b border-blue-200 py-16">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl font-display font-bold text-slate-900 mb-6">
            Legal Resources & Guides
          </h1>
          <p className="text-xl text-slate-600">
            Free legal information, guides, and FAQs to help you understand Kenyan law
          </p>
        </div>
      </section>

      {/* Legal Guides */}
      <section className="container py-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-display font-bold text-slate-900">Legal Guides</h2>
          <Book className="h-8 w-8 text-primary" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {legalGuides.map((guide, index) => (
            <div key={index} className="card hover:shadow-large transition-shadow">
              <div className="p-6">
                <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full mb-4">
                  {guide.category}
                </span>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{guide.title}</h3>
                <p className="text-slate-600 mb-4 line-clamp-3">{guide.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500">{guide.readTime}</span>
                  <Link 
                    to={guide.link} 
                    className="text-primary font-semibold hover:text-navy-700 inline-flex items-center transition-colors"
                  >
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs */}
      <section className="container py-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-display font-bold text-slate-900">Frequently Asked Questions</h2>
          <HelpCircle className="h-8 w-8 text-primary" />
        </div>
        
        <div className="max-w-3xl mx-auto space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="card">
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">{faq.question}</h3>
                <p className="text-slate-600">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-600 mb-6">Have more questions?</p>
          <Link to="/ai" className="btn-primary inline-flex items-center">
            Ask Our AI Assistant
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container py-16">
        <div className="card-gradient bg-gradient-to-r from-primary to-navy-700 text-white p-12 rounded-2xl text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            Need Personalized Legal Advice?
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            These guides provide general information. For advice specific to your situation, consult with a qualified lawyer.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link to="/lawyers" className="bg-white text-primary px-8 py-4 rounded-xl hover:bg-slate-50 transition-colors text-lg font-semibold shadow-large">
              Find a Lawyer
            </Link>
            <Link to="/marketplace" className="bg-navy-900 text-white px-8 py-4 rounded-xl hover:bg-black transition-colors text-lg font-semibold border-2 border-white">
              Browse Documents
            </Link>
          </div>
        </div>
      </section>
    </GlobalLayout>
  );
};
