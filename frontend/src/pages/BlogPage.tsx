import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, User, Clock, ArrowRight, Tag, TrendingUp, BookOpen, Mail, Loader } from 'lucide-react';
import axiosInstance from '../lib/axios';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  authorRole: string;
  date: string;
  readTime: string;
  category: string;
  imageUrl: string;
  featured?: boolean;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Understanding the New Data Protection Regulations in Kenya: A Comprehensive Guide for Businesses',
    excerpt: 'Kenya\'s Data Protection Act, 2019 has transformed how businesses handle personal information. Learn about compliance requirements, penalties for violations, and best practices for protecting customer data in the digital age.',
    author: 'Dr. Sarah Kamau',
    authorRole: 'Corporate Law Expert',
    date: 'December 1, 2025',
    readTime: '8 min read',
    category: 'Corporate Law',
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop',
    featured: true
  },
  {
    id: '2',
    title: 'Land Ownership Rights in Kenya: What Every Property Buyer Should Know Before Signing',
    excerpt: 'Avoid costly mistakes when purchasing land in Kenya. This guide covers title searches, land control board consent, encumbrances, and the complete conveyancing process from offer to registration.',
    author: 'Adv. James Mwangi',
    authorRole: 'Property Law Specialist',
    date: 'November 28, 2025',
    readTime: '10 min read',
    category: 'Property Law',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop',
    featured: true
  },
  {
    id: '3',
    title: 'Employment Contracts in Kenya: Essential Clauses Every Employer and Employee Must Include',
    excerpt: 'Protect your rights and obligations with a comprehensive employment contract. Learn about statutory requirements under the Employment Act, probation periods, termination clauses, and non-compete agreements.',
    author: 'Adv. Grace Njeri',
    authorRole: 'Employment Law Advocate',
    date: 'November 25, 2025',
    readTime: '7 min read',
    category: 'Employment Law',
    imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=400&fit=crop'
  },
  {
    id: '4',
    title: 'Navigating Divorce in Kenya: A Step-by-Step Guide to Matrimonial Proceedings',
    excerpt: 'Divorce can be emotionally and legally complex. This guide walks you through petition filing, grounds for divorce, property division under the Matrimonial Property Act, and child custody arrangements.',
    author: 'Adv. Peter Ochieng',
    authorRole: 'Family Law Expert',
    date: 'November 22, 2025',
    readTime: '12 min read',
    category: 'Family Law',
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop'
  },
  {
    id: '5',
    title: 'Company Registration in Kenya: Complete Guide to BRS, KRA, and Legal Compliance',
    excerpt: 'Starting a business? Learn the complete process of registering a limited company in Kenya, from name reservation to obtaining your certificate of incorporation and tax compliance certificates.',
    author: 'Dr. Mary Wanjiru',
    authorRole: 'Business Formation Lawyer',
    date: 'November 20, 2025',
    readTime: '9 min read',
    category: 'Corporate Law',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&h=400&fit=crop'
  },
  {
    id: '6',
    title: 'Debt Recovery in Kenya: Legal Options for Collecting Unpaid Money',
    excerpt: 'Owed money and not getting paid? Explore your legal options including demand letters, small claims court, attachment orders, and bankruptcy proceedings. Know when to engage a lawyer.',
    author: 'Adv. David Kiprono',
    authorRole: 'Commercial Litigation Expert',
    date: 'November 18, 2025',
    readTime: '6 min read',
    category: 'Commercial Law',
    imageUrl: 'https://images.unsplash.com/photo-1554224311-beee4ffe3208?w=800&h=400&fit=crop'
  },
  {
    id: '7',
    title: 'Intellectual Property Protection in Kenya: Trademarks, Patents, and Copyright Basics',
    excerpt: 'Protect your creative works, inventions, and brand identity. Learn how to register trademarks with KIPI, secure patents, and enforce copyright under Kenyan law.',
    author: 'Adv. Anne Muthoni',
    authorRole: 'IP Law Specialist',
    date: 'November 15, 2025',
    readTime: '11 min read',
    category: 'Intellectual Property',
    imageUrl: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=800&h=400&fit=crop'
  },
  {
    id: '8',
    title: 'Tenancy Agreements in Kenya: Rights and Obligations of Landlords and Tenants',
    excerpt: 'Avoid rental disputes by understanding your legal rights. This guide covers deposit protection, rent increases, eviction procedures, and dispute resolution under the Landlord and Tenant Act.',
    author: 'Adv. John Omondi',
    authorRole: 'Real Estate Law Advocate',
    date: 'November 12, 2025',
    readTime: '8 min read',
    category: 'Property Law',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop'
  },
  {
    id: '9',
    title: 'Wills and Estate Planning in Kenya: Ensuring Your Assets are Protected',
    excerpt: 'Don\'t leave your family\'s future to chance. Learn how to draft a valid will, appoint executors, minimize inheritance disputes, and navigate succession law in Kenya.',
    author: 'Dr. Sarah Kamau',
    authorRole: 'Estate Planning Expert',
    date: 'November 10, 2025',
    readTime: '10 min read',
    category: 'Family Law',
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=400&fit=crop'
  }
];

const categories = ['All', 'Corporate Law', 'Property Law', 'Employment Law', 'Family Law', 'Commercial Law', 'Intellectual Property'];

export const BlogPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Newsletter subscription state
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await axiosInstance.post('/newsletter/subscribe', { email });
      
      if (response.data.success) {
        setMessage({ type: 'success', text: 'Successfully subscribed! Check your inbox.' });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: response.data.message || 'Subscription failed' });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to subscribe. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = selectedCategory === 'All' 
    ? blogPosts 
    : blogPosts.filter(post => post.category === selectedCategory);

  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = filteredPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Legal Insights Blog</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Expert legal commentary, guides, and updates on Kenyan law from our team of verified lawyers.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === category
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-700 border border-slate-300 hover:border-indigo-300 hover:bg-indigo-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Featured Posts */}
        {selectedCategory === 'All' && featuredPosts.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center mb-6">
              <TrendingUp className="h-6 w-6 text-indigo-600 mr-2" />
              <h2 className="text-2xl font-bold text-slate-900">Featured Articles</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {featuredPosts.map(post => (
                <Link
                  key={post.id}
                  to={`/blog/${post.id}`}
                  className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-indigo-600 text-white text-sm font-semibold rounded-full">
                        Featured
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                        {post.category}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-slate-600 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                      <div className="flex items-center text-sm text-slate-600">
                        <User className="h-4 w-4 mr-2" />
                        <div>
                          <p className="font-medium">{post.author}</p>
                          <p className="text-xs text-slate-500">{post.authorRole}</p>
                        </div>
                      </div>
                      <div className="text-sm text-slate-500 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {post.date}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Regular Posts */}
        <div>
          {selectedCategory !== 'All' && (
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{selectedCategory} Articles</h2>
          )}
          <div className="grid md:grid-cols-3 gap-6">
            {regularPosts.map(post => (
              <Link
                key={post.id}
                to={`/blog/${post.id}`}
                className="group bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow"
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={post.imageUrl}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {post.readTime}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-600">
                      <p className="font-medium">{post.author}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filteredPosts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600 text-lg">No articles found in this category.</p>
              <button
                onClick={() => setSelectedCategory('All')}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View all articles
              </button>
            </div>
          )}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 bg-gradient-to-br from-blue-50 to-indigo-50 border-y border-blue-100 rounded-lg shadow-lg p-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
              <Mail className="h-7 w-7 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Stay Updated with Legal Insights</h2>
            <p className="text-sm text-slate-600 mb-6">
              Subscribe to our newsletter and receive the latest legal updates, guides, and expert commentary directly to your inbox.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mb-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-100 text-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  'Subscribe'
                )}
              </button>
            </form>
            {message && (
              <div className={`text-sm mb-3 ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
                {message.text}
              </div>
            )}
            <p className="text-xs text-slate-500">
              No spam. Unsubscribe anytime. Read our <Link to="/privacy" className="text-blue-600 hover:text-blue-700 underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
