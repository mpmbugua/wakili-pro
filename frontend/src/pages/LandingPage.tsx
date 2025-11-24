import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Gavel, 
  MessageSquare, 
  ShoppingBag, 
  BookOpen, 
  ArrowRight, 
  Star, 
  MapPin,
  Shield,
  Zap,
  Users,
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                <Gavel className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                Wakili Pro
              </span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/ai" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                AI Assistant
              </Link>
              <Link to="/lawyers" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                Find Lawyers
              </Link>
              <Link to="/marketplace" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                Documents
              </Link>
              <Link to="/services" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                Services
              </Link>
              <Link to="/resources" className="text-slate-700 hover:text-blue-600 font-medium transition-colors">
                Resources
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-slate-600 font-medium">Welcome, {user?.firstName}</span>
                  <Link 
                    to="/dashboard" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={async () => {
                      await useAuthStore.getState().logout();
                      window.location.reload();
                    }}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-slate-700 hover:text-blue-600 font-medium transition-colors"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow-md"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 opacity-70"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-6">
                <Zap className="h-4 w-4" />
                <span>Trusted by 10,000+ users</span>
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
                Legal Excellence
                <span className="block mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Made Simple
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Get instant legal guidance with AI, connect with verified lawyers, and access professional documents - all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link 
                  to="/ai" 
                  className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl font-semibold text-lg inline-flex items-center justify-center"
                >
                  Try AI Assistant Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link 
                  to="/lawyers" 
                  className="px-8 py-4 border-2 border-slate-300 text-slate-700 rounded-lg hover:border-blue-600 hover:text-blue-600 transition-all font-semibold text-lg inline-flex items-center justify-center"
                >
                  Browse Lawyers
                </Link>
              </div>
              <div className="flex items-center space-x-6 text-sm text-slate-600">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <span>24/7 AI support</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-100 via-indigo-100 to-violet-100 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 shadow-lg mb-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="bg-blue-100 p-3 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900">AI Legal Assistant</div>
                      <div className="text-sm text-slate-500">Instant answers</div>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-sm text-slate-700">"What are the requirements for company registration in Kenya?"</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <Gavel className="h-8 w-8 text-emerald-600 mb-2" />
                    <div className="text-2xl font-bold text-slate-900">500+</div>
                    <div className="text-sm text-slate-600">Expert Lawyers</div>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <ShoppingBag className="h-8 w-8 text-violet-600 mb-2" />
                    <div className="text-2xl font-bold text-slate-900">1000+</div>
                    <div className="text-sm text-slate-600">Legal Docs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">10K+</div>
              <div className="text-slate-600 font-medium">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-emerald-600 mb-2">500+</div>
              <div className="text-slate-600 font-medium">Verified Lawyers</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-violet-600 mb-2">50K+</div>
              <div className="text-slate-600 font-medium">Consultations</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-amber-600 mb-2">98%</div>
              <div className="text-slate-600 font-medium">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything You Need for Legal Support
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Comprehensive legal solutions powered by AI and human expertise
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* AI Assistant Feature */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-200 hover:border-blue-300 group">
              <div className="bg-gradient-to-br from-blue-100 to-blue-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">AI Legal Assistant</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Get instant answers to legal questions, 24/7. Our AI provides guidance based on Kenyan law and recommends next steps.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>Instant responses powered by AI</span>
                </li>
                <li className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>Kenyan law expertise</span>
                </li>
                <li className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>Available 24/7</span>
                </li>
              </ul>
              <Link 
                to="/ai" 
                className="text-blue-600 font-semibold hover:text-blue-700 inline-flex items-center group-hover:gap-2 transition-all"
              >
                Try it free <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Lawyers Feature */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-200 hover:border-emerald-300 group">
              <div className="bg-gradient-to-br from-emerald-100 to-emerald-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Gavel className="h-8 w-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Expert Lawyers</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Book video consultations with verified lawyers. Browse profiles, ratings, and specializations to find your perfect match.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>500+ verified advocates</span>
                </li>
                <li className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>Video consultations</span>
                </li>
                <li className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>All practice areas covered</span>
                </li>
              </ul>
              <Link 
                to="/lawyers" 
                className="text-emerald-600 font-semibold hover:text-emerald-700 inline-flex items-center group-hover:gap-2 transition-all"
              >
                Find lawyers <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Marketplace Feature */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all border border-slate-200 hover:border-violet-300 group">
              <div className="bg-gradient-to-br from-violet-100 to-violet-200 w-16 h-16 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <ShoppingBag className="h-8 w-8 text-violet-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">Legal Documents</h3>
              <p className="text-slate-600 mb-6 leading-relaxed">
                Access professional legal templates and documents. Download instantly after purchase and customize for your needs.
              </p>
              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>1000+ legal templates</span>
                </li>
                <li className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>Instant download</span>
                </li>
                <li className="flex items-center text-sm text-slate-700">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mr-2 flex-shrink-0" />
                  <span>Customizable formats</span>
                </li>
              </ul>
              <Link 
                to="/marketplace" 
                className="text-violet-600 font-semibold hover:text-violet-700 inline-flex items-center group-hover:gap-2 transition-all"
              >
                Browse marketplace <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Lawyers Section */}
      <section id="lawyers" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Featured Lawyers
            </h2>
            <p className="text-xl text-slate-600">
              Connect with verified legal experts in your area
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Sample Lawyer Cards */}
            {[
              { name: 'Dr. Sarah Kamau', specialty: 'Corporate Law', location: 'Nairobi', rating: 4.9, experience: '15+' },
              { name: 'Adv. James Mwangi', specialty: 'Family Law', location: 'Mombasa', rating: 4.8, experience: '12+' },
              { name: 'Adv. Grace Njeri', specialty: 'Real Estate', location: 'Nairobi', rating: 4.7, experience: '10+' }
            ].map((lawyer, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-slate-200 hover:border-blue-300">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                      {lawyer.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-900">{lawyer.name}</h3>
                      <p className="text-sm text-slate-600">{lawyer.specialty}</p>
                    </div>
                  </div>
                  <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-semibold">{lawyer.rating}</span>
                  </div>
                </div>
                <div className="flex items-center text-sm text-slate-600 mb-4">
                  <MapPin className="h-4 w-4 mr-1 text-slate-400" />
                  {lawyer.location}, Kenya
                </div>
                <div className="flex items-center space-x-4 mb-4 text-sm">
                  <div className="flex items-center text-slate-600">
                    <Clock className="h-4 w-4 mr-1 text-slate-400" />
                    {lawyer.experience} years
                  </div>
                  <div className="flex items-center text-emerald-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verified
                  </div>
                </div>
                <p className="text-slate-600 text-sm mb-6">
                  Specialized in {lawyer.specialty.toLowerCase()} with extensive experience in client representation and legal advisory.
                </p>
                <Link 
                  to="/login" 
                  className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center block"
                >
                  Book Consultation
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link 
              to="/lawyers" 
              className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700 text-lg"
            >
              View all 500+ lawyers <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Legal Resources & Guides
            </h2>
            <p className="text-xl text-slate-600">
              Free articles, guides, and legal information to help you understand Kenyan law
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Understanding Property Law in Kenya", category: "Real Estate", color: "emerald", icon: BookOpen },
              { title: "Small Business Legal Requirements", category: "Business Law", color: "blue", icon: TrendingUp },
              { title: "Family Law: What You Need to Know", category: "Family Law", color: "violet", icon: Users }
            ].map((article, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all border border-slate-200 hover:border-blue-300 group">
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 bg-${article.color}-100 text-${article.color}-700 rounded-full text-sm font-semibold`}>
                    {article.category}
                  </span>
                  <article.icon className={`h-6 w-6 text-${article.color}-600`} />
                </div>
                <h3 className="font-bold text-xl text-slate-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h3>
                <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                  Comprehensive guide covering key aspects, legal requirements, and practical steps you need to take.
                </p>
                <Link 
                  to="/resources" 
                  className="text-blue-600 font-semibold hover:text-blue-700 text-sm inline-flex items-center group-hover:gap-2 transition-all"
                >
                  Read more <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/5"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-full text-sm font-semibold mb-6">
            <Shield className="h-4 w-4" />
            <span>Trusted & Secure Platform</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Get Legal Help?
          </h2>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed">
            Start with our free AI assistant or book a consultation with an expert lawyer. Get the legal support you need today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/ai" 
              className="px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-all text-lg font-semibold shadow-xl hover:shadow-2xl inline-flex items-center justify-center"
            >
              Try AI Assistant Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              to="/register" 
              className="px-8 py-4 bg-blue-800 text-white rounded-lg hover:bg-blue-900 transition-all text-lg font-semibold border-2 border-white/20 shadow-xl inline-flex items-center justify-center"
            >
              Create Free Account
            </Link>
          </div>
          <div className="mt-8 flex items-center justify-center space-x-8 text-blue-100">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm">Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-lg">
                  <Gavel className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Wakili Pro</span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                Your trusted platform for legal services in Kenya. Connecting clients with expert lawyers and AI-powered legal assistance.
              </p>
              <div className="flex items-center space-x-2 text-sm text-emerald-400">
                <Shield className="h-4 w-4" />
                <span>Secure & Verified</span>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Services</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/ai" className="hover:text-white transition-colors flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>AI Assistant</span>
                  </Link>
                </li>
                <li>
                  <Link to="/lawyers" className="hover:text-white transition-colors flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Find Lawyers</span>
                  </Link>
                </li>
                <li>
                  <Link to="/marketplace" className="hover:text-white transition-colors flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Legal Documents</span>
                  </Link>
                </li>
                <li>
                  <Link to="/services" className="hover:text-white transition-colors flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Legal Services</span>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Resources</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link to="/resources" className="hover:text-white transition-colors flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Legal Guides</span>
                  </Link>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>FAQs</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Blog</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Knowledge Base</span>
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-4 text-lg">Company</h4>
              <ul className="space-y-3 text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>About Us</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Contact</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Privacy Policy</span>
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors flex items-center space-x-2">
                    <ArrowRight className="h-4 w-4" />
                    <span>Terms of Service</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-slate-400">&copy; 2025 Wakili Pro. All rights reserved.</p>
              <div className="flex items-center space-x-6 text-sm text-slate-400">
                <span>Made with ❤️ in Kenya</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
