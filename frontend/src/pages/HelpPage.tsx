import React, { useState } from 'react';
import { GlobalLayout } from '../components/layout';
import { HelpCircle, MessageCircle, BookOpen, FileText, Phone, Mail, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

export const HelpPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const categories = [
    { id: 'all', name: 'All Topics' },
    { id: 'account', name: 'Account & Billing' },
    { id: 'consultations', name: 'Consultations' },
    { id: 'documents', name: 'Documents' },
    { id: 'services', name: 'Legal Services' },
  ];

  const faqs: FAQItem[] = [
    {
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Go to Settings > Security and click "Change Password". Enter your current password and choose a new one.',
    },
    {
      category: 'consultations',
      question: 'How do I schedule a consultation with a lawyer?',
      answer: 'Navigate to "Find Lawyer", select a lawyer, and click "Book Consultation". Choose your preferred date and time, then complete the payment.',
    },
    {
      category: 'consultations',
      question: 'Can I cancel or reschedule a consultation?',
      answer: 'Yes, you can cancel up to 24 hours before the scheduled time. Go to your dashboard, find the booking, and select "Cancel" or "Reschedule".',
    },
    {
      category: 'documents',
      question: 'How do I purchase legal document templates?',
      answer: 'Browse the Document Marketplace, select a template, and complete the payment. Templates are available for instant download after purchase.',
    },
    {
      category: 'documents',
      question: 'How long does document review take?',
      answer: 'Standard document reviews are completed within 24 hours. You\'ll receive a notification when your review is ready.',
    },
    {
      category: 'services',
      question: 'What is the KES 500 commitment fee?',
      answer: 'The commitment fee ensures serious inquiries and helps us match you with the right lawyer. This fee is non-refundable but goes toward your final service cost.',
    },
    {
      category: 'account',
      question: 'What payment methods do you accept?',
      answer: 'We accept M-Pesa for mobile payments and card payments through Flutterwave for your convenience.',
    },
    {
      category: 'services',
      question: 'How do I track my service request?',
      answer: 'All your service requests are visible on your dashboard. You\'ll receive notifications for status updates and when a lawyer responds.',
    },
  ];

  const filteredFaqs = activeCategory === 'all' 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  return (
    <GlobalLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Help & Support</h1>
          <p className="text-lg text-slate-600">Get answers to your questions or reach out to our support team</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Live Chat</h3>
            <p className="text-sm text-slate-600 mb-4">Chat with our support team in real-time</p>
            <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              Start Chat →
            </button>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Email Support</h3>
            <p className="text-sm text-slate-600 mb-4">Send us an email and we'll respond within 24 hours</p>
            <a href="mailto:support@wakilipro.com" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              support@wakilipro.com
            </a>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-6 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Phone className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Phone Support</h3>
            <p className="text-sm text-slate-600 mb-4">Call us during business hours (9 AM - 6 PM EAT)</p>
            <a href="tel:+254700000000" className="text-blue-600 hover:text-blue-700 font-medium text-sm">
              +254 700 000 000
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-6">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 rounded-lg">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-slate-50 transition"
                >
                  <div className="flex items-center space-x-3">
                    <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <span className="font-medium text-slate-900">{faq.question}</span>
                  </div>
                  {expandedFaq === index ? (
                    <ChevronUp className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-500 flex-shrink-0" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4 pl-12">
                    <p className="text-slate-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h3 className="text-xl font-semibold text-slate-900">User Guide</h3>
            </div>
            <p className="text-slate-700 mb-4">
              Learn how to make the most of Wakili Pro with our comprehensive user guide
            </p>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              View Guide
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="h-8 w-8 text-purple-600" />
              <h3 className="text-xl font-semibold text-slate-900">Legal Resources</h3>
            </div>
            <p className="text-slate-700 mb-4">
              Access helpful legal resources, guides, and information
            </p>
            <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition">
              Browse Resources
            </button>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mt-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Still Need Help?</h2>
          <p className="text-slate-600 mb-6">Send us a message and we'll get back to you as soon as possible</p>
          
          <form className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Subject</label>
              <input
                type="text"
                placeholder="What do you need help with?"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Message</label>
              <textarea
                rows={6}
                placeholder="Describe your issue or question in detail..."
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              ></textarea>
            </div>
            
            <button
              type="submit"
              className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </GlobalLayout>
  );
};

export default HelpPage;
