
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../lib/axios';
import { WakiliLogo } from '../components/ui/WakiliLogo';
import { 
  MessageSquare,
  Scale,
  ShoppingBag,
  ArrowRight, 
  Star, 
  MapPin,
  Shield,
  CheckCircle,
  FileText,
  Home,
  Briefcase,
  Heart,
  Clock,
  Mail,
  Loader
} from 'lucide-react';
import { getFeaturedExamples } from '../data/servicePackageExamples';

interface FeaturedArticle {
  id: string;
  title: string;
  content: string;
  authorId: string;
  isPremium: boolean;
  isPublished: boolean;
  User?: {
    firstName: string;
    lastName: string;
  };
}

// Newsletter Subscription Component
const NewsletterSection: React.FC = () => {
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

  return (
    <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-50 border-y border-blue-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4">
            <Mail className="h-7 w-7 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Stay Updated with Legal Insights
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl mx-auto">
            Subscribe to our newsletter and receive the latest legal updates, guides, and expert commentary directly to your inbox.
          </p>
        </div>

        <form onSubmit={handleSubscribe} className="max-w-md mx-auto mb-4">
          <div className="flex gap-2">
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
              className="px-6 py-3 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          </div>
        </form>

        {message && (
          <div className={`text-sm mb-3 ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}>
            {message.text}
          </div>
        )}

        <p className="text-xs text-slate-500">
          No spam. Unsubscribe anytime. Read our{' '}
          <Link to="/privacy" className="text-blue-600 hover:text-blue-700 underline">
            Privacy Policy
          </Link>.
        </p>
      </div>
    </section>
  );
};

export const LandingPage: React.FC = () => {
  const [featuredArticles, setFeaturedArticles] = useState<FeaturedArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    const fetchFeaturedArticles = async () => {
      try {
        const response = await axiosInstance.get('/articles/published?limit=3');
        setFeaturedArticles(response.data.data.articles || []);
      } catch (error) {
        console.error('Failed to fetch featured articles:', error);
      } finally {
        setLoadingArticles(false);
      }
    };

    fetchFeaturedArticles();
  }, []);

  const extractMetadata = (content: string) => {
    const metadataMatch = content.match(/<!--METADATA:(.*?)-->/);
    if (metadataMatch) {
      try {
        return JSON.parse(metadataMatch[1]);
      } catch {
        return {};
      }
    }
    return {};
  };

  return (
    <>
          {/* Hero Section with Services */}
          <section id="services" className="py-8 bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-semibold text-slate-900 mb-2">
                  Legal Services Made Simple
                </h1>
                <p className="text-sm text-slate-600 max-w-2xl mx-auto">
                  Get instant legal guidance with AI, connect with verified lawyers, and access professional documents
                </p>
              </div>
              
              {/* Six Service Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* AI Assistant */}
                <Link to="/ai" className="bg-white rounded border border-slate-300 p-5 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer block">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Smart AI Kenyan Lawyer</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">
                    Get instant answers to legal questions, 24/7. AI-powered guidance based on Kenyan law.
                  </p>
                  <span className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center font-medium">
                    Try for free <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </Link>

                {/* Expert Lawyers */}
                <Link to="/lawyers" className="bg-white rounded border border-slate-300 p-5 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer block">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <Scale className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Find a Lawyer</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">
                    Book video consultations with 500+ verified advocates across all practice areas.
                  </p>
                  <span className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center font-medium">
                    Browse lawyers <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </Link>

                {/* Legal Documents */}
                <Link to="/marketplace" className="bg-white rounded border border-slate-300 p-5 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer block">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <ShoppingBag className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Get Legal Document</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">
                    Access 500+ professional legal templates. Free AI review with every purchase.
                  </p>
                  <span className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center font-medium">
                    Browse docs <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </Link>

                {/* Document Review - Case Analysis */}
                <Link to="/documents" className="bg-white rounded border border-slate-300 p-5 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer block">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Case Analysis & Advice</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">
                    Upload documents for AI analysis (KES 500) or lawyer certification (from KES 2,000). 24-hour turnaround.
                  </p>
                  <span className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center font-medium">
                    Upload document <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </Link>

                {/* Legal Service Packages */}
                <Link to="/services" className="bg-white rounded border border-slate-300 p-5 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer block">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Book Legal Service Package</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">
                    Fixed-price packages for common legal needs. Property, business, family law, and more.
                  </p>
                  <span className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center font-medium">
                    View services <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </Link>

                {/* Legal Resources */}
                <Link to="/resources" className="bg-white rounded border border-slate-300 p-5 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer block">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Legal Guides and Insights</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">
                    Expert articles and guides to help you understand Kenyan law.
                  </p>
                  <span className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center font-medium">
                    Browse resources <ArrowRight className="ml-1 h-3 w-3" />
                  </span>
                </Link>
              </div>
            </div>
          </section>

          {/* Popular Legal Services */}
          <section id="service-packages" className="py-8 bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  Legal Service Packages
                </h2>
                <p className="text-xs text-slate-600">
                  Fixed-price legal services by verified lawyers. Transparent pricing, clear deliverables, professional results.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { ...getFeaturedExamples()[0], icon: Home },
                  { ...getFeaturedExamples()[1], icon: Briefcase },
                  { ...getFeaturedExamples()[2], icon: Heart }
                ].map((service, i) => {
                  const IconComponent = service.icon;
                  return (
                    <div key={i} className="bg-white rounded border border-slate-300 p-4 hover:border-blue-400 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {service.category.split(' & ')[0]}
                        </span>
                        <IconComponent className="h-4 w-4 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">
                        {service.title.replace(' - Full Service', '').replace(' Package', '').replace(' - Uncontested', '').replace(' & Negotiation', '')}
                      </h3>
                      <p className="text-xs text-slate-600 mb-3">
                        {service.description.split('.')[0]}
                      </p>
                      <div className="flex items-center gap-1 text-xs mb-3 pb-3 border-b border-slate-100 text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>{service.deliveryTime}</span>
                      </div>
                      <Link 
                        to="/services" 
                        className="block w-full text-center px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 text-center">
                <Link 
                  to="/services" 
                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  View all legal services <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </div>
          </section>

          {/* Popular Legal Documents */}
          <section id="legal-documents" className="py-8 bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  Popular Legal Documents
                </h2>
                <p className="text-xs text-slate-600">
                  Professional legal templates ready for instant download. Free AI review included.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { 
                    title: 'Tenancy Agreement', 
                    category: 'Real Estate', 
                    price: 2000,
                    description: 'Comprehensive rental agreement for residential or commercial properties',
                    icon: Home
                  },
                  { 
                    title: 'Employment Contract', 
                    category: 'Employment', 
                    price: 1500,
                    description: 'Standard employment agreement compliant with Kenyan labour laws',
                    icon: Briefcase
                  },
                  { 
                    title: 'Sale Agreement', 
                    category: 'Commercial', 
                    price: 2500,
                    description: 'Legally binding contract for sale of goods or property',
                    icon: FileText
                  }
                ].map((doc, i) => {
                  const IconComponent = doc.icon;
                  return (
                    <div key={i} className="bg-white rounded border border-slate-300 p-4 hover:border-blue-400 hover:shadow-sm transition-all">
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                          {doc.category}
                        </span>
                        <IconComponent className="h-4 w-4 text-slate-400" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 mb-2">
                        {doc.title}
                      </h3>
                      <p className="text-xs text-slate-600 mb-3">
                        {doc.description}
                      </p>
                      <div className="flex items-center gap-1 text-xs mb-3 pb-3 border-b border-slate-100 text-slate-500">
                        <CheckCircle className="h-3 w-3 text-emerald-600" />
                        <span>Instant Download</span>
                      </div>
                      <Link 
                        to="/marketplace" 
                        className="block w-full text-center px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        Purchase Now
                      </Link>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 text-center">
                <Link 
                  to="/marketplace" 
                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Browse all 500+ document templates <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            </div>
          </section>

          {/* Featured Lawyers Section */}
          <section id="lawyers" className="py-8 bg-slate-50 border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  Find a Lawyer
                </h2>
                <p className="text-xs text-slate-600">
                  Connect with verified legal experts across Kenya
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
            {/* Sample Lawyer Cards */}
            {[
              { name: 'Dr. Sarah Kamau', specialty: 'Corporate Law', location: 'Nairobi', rating: 4.9, cases: '200+' },
              { name: 'Adv. James Mwangi', specialty: 'Family Law', location: 'Mombasa', rating: 4.8, cases: '150+' },
              { name: 'Adv. Grace Njeri', specialty: 'Real Estate Law', location: 'Nairobi', rating: 4.7, cases: '180+' },
              { name: 'Adv. Peter Ochieng', specialty: 'Criminal Law', location: 'Kisumu', rating: 4.9, cases: '220+' },
              { name: 'Dr. Mary Wanjiru', specialty: 'Immigration Law', location: 'Nairobi', rating: 4.8, cases: '170+' },
              { name: 'Adv. David Kiprono', specialty: 'Employment Law', location: 'Nakuru', rating: 4.7, cases: '160+' }
              ].map((lawyer, i) => (
                <div key={i} className="bg-white rounded border border-slate-300 p-4 hover:border-blue-400 hover:shadow-sm transition-all">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {lawyer.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-slate-900">{lawyer.name}</h3>
                    <p className="text-xs text-slate-600">{lawyer.specialty}</p>
                    <div className="flex items-center text-xs text-slate-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {lawyer.location}
                    </div>
                  </div>
                  <div className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-current" />
                    <span className="text-xs font-medium">{lawyer.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="flex items-center text-slate-600">
                    <CheckCircle className="h-3 w-3 mr-1 text-emerald-600" />
                    Verified
                  </div>
                  <div className="text-slate-500">
                    {lawyer.cases} cases
                  </div>
                </div>
                <Link 
                  to="/lawyers" 
                  className="block w-full text-center px-3 py-1.5 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  View Profile
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link 
              to="/lawyers" 
              className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              View all 500+ lawyers <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
              </div>
            </div>
          </section>

          {/* Legal Guides and Insights */}
          <section id="insights" className="py-8 bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 mb-1">
                    Legal Guides and Insights
                  </h2>
                  <p className="text-xs text-slate-600">
                    Expert articles and guides to help you understand Kenyan law
                  </p>
                </div>
                <Link 
                  to="/resources" 
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center"
                >
                  View all <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
              
              {loadingArticles ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded border border-slate-300 p-4 animate-pulse">
                      <div className="h-4 bg-slate-200 rounded w-20 mb-3"></div>
                      <div className="h-5 bg-slate-200 rounded mb-2"></div>
                      <div className="h-5 bg-slate-200 rounded mb-3"></div>
                      <div className="h-3 bg-slate-200 rounded w-32"></div>
                    </div>
                  ))}
                </div>
              ) : featuredArticles.length > 0 ? (
                <div className="grid md:grid-cols-3 gap-4">
                  {featuredArticles.map((article) => {
                    const metadata = extractMetadata(article.content);
                    const authorName = article.User 
                      ? `${article.User.firstName} ${article.User.lastName}`
                      : 'Wakili Pro Team';
                    const category = metadata.category || 'Legal Insights';
                    const readTime = Math.ceil(article.content.length / 1000);
                    
                    return (
                      <div key={article.id} className="bg-white rounded border border-slate-300 p-4 hover:border-blue-400 hover:shadow-sm transition-all">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                          {category}
                        </span>
                        <h3 className="text-sm font-semibold text-slate-900 mt-3 mb-2 leading-snug line-clamp-2">
                          {article.title}
                        </h3>
                        <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                          <span>{authorName}</span>
                          <span>{readTime} min read</span>
                        </div>
                        <Link 
                          to={`/resources/article/${article.id}`}
                          className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center font-medium"
                        >
                          Read article <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-4">
                  {/* Fallback sample articles if no real articles exist */}
                  {[
                    { 
                      title: "New Data Protection Regulations: What Businesses Need to Know", 
                      author: "Dr. Sarah Kamau",
                      date: "Nov 20, 2025",
                      category: "Corporate Law"
                    },
                    { 
                      title: "Recent Supreme Court Rulings on Land Ownership Disputes", 
                      author: "Adv. James Mwangi",
                      date: "Nov 18, 2025",
                      category: "Property Law"
                    },
                    { 
                      title: "Understanding the Employment Act Amendments 2025", 
                      author: "Adv. Grace Njeri",
                      date: "Nov 15, 2025",
                      category: "Labour Law"
                    }
                  ].map((article, i) => (
                    <div key={i} className="bg-white rounded border border-slate-300 p-4 hover:border-blue-400 hover:shadow-sm transition-all">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-medium">
                        {article.category}
                      </span>
                      <h3 className="text-sm font-semibold text-slate-900 mt-3 mb-2 leading-snug">
                        {article.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                        <span>{article.author}</span>
                        <span>{article.date}</span>
                      </div>
                      <Link 
                        to="/resources" 
                        className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center font-medium"
                      >
                        Read article <ArrowRight className="ml-1 h-3 w-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Newsletter Subscription Section */}
          <NewsletterSection />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-6">
            <div>
              <div className="mb-3 scale-75 origin-left">
                <WakiliLogo size="md" variant="full" />
              </div>
              <p className="text-xs leading-relaxed mb-3">
                Your trusted platform for legal services in Kenya.
              </p>
              <div className="flex items-center space-x-1.5 text-xs text-emerald-400">
                <Shield className="h-3 w-3" />
                <span>Secure & Verified</span>
              </div>
            </div>
            <div>
              <h4 className="text-white text-xs font-semibold mb-3">Services</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/ai" className="hover:text-white transition-colors">
                    AI Assistant
                  </Link>
                </li>
                <li>
                  <Link to="/lawyers" className="hover:text-white transition-colors">
                    Find Lawyers
                  </Link>
                </li>
                <li>
                  <Link to="/marketplace" className="hover:text-white transition-colors">
                    Legal Documents
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs font-semibold mb-3">Resources</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/resources" className="hover:text-white transition-colors">
                    Legal Guides
                  </Link>
                </li>
                <li>
                  <Link to="/faq" className="hover:text-white transition-colors">
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link to="/blog" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/about" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-4">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
              <p className="text-xs">&copy; 2025 Wakili Pro. All rights reserved.</p>
              <div className="text-xs">
                <span>Made in Kenya</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};
