import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Gavel, MessageSquare, ShoppingBag, BookOpen, ArrowRight, Star, MapPin } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="navbar">
        <div className="container">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Gavel className="h-8 w-8 text-primary" />
              <span className="text-2xl font-display font-bold text-slate-900">Wakili Pro</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link to="/ai" className="text-slate-700 hover:text-primary transition-colors">AI Assistant</Link>
              <Link to="/lawyers" className="text-slate-700 hover:text-primary transition-colors">Find Lawyers</Link>
              <Link to="/marketplace" className="text-slate-700 hover:text-primary transition-colors">Legal Documents</Link>
              <Link to="/services" className="text-slate-700 hover:text-primary transition-colors">Legal Services</Link>
              <Link to="/resources" className="text-slate-700 hover:text-primary transition-colors">Resources</Link>
            </nav>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-slate-600">Welcome, {user?.firstName}</span>
                  <Link to="/dashboard" className="btn-primary">
                    Dashboard
                  </Link>
                  <button
                    onClick={async () => {
                      await useAuthStore.getState().logout();
                      window.location.reload();
                    }}
                    className="btn-outline"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-slate-700 hover:text-primary font-medium transition-colors">
                    Log In
                  </Link>
                  <Link to="/register" className="btn-primary">
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}      {/* Hero Section */}
      <section className="bg-gradient-primary section">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-slate-900 leading-tight mb-6">
                <span className="text-primary">Legal Excellence</span>
              </h1>
              <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                Get instant legal guidance with AI, connect with verified lawyers, and access legal documents - all in one platform.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/ai" className="btn-primary text-lg inline-flex items-center justify-center">
                  Try AI Assistant Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/lawyers" className="btn-outline text-lg inline-flex items-center justify-center">
                  Browse Lawyers
                </Link>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/hero-illustration.svg" 
                alt="Legal Services" 
                className="w-full h-auto"
                onError={(e) => {
                  // Fallback placeholder
                  e.currentTarget.style.display = 'none';
                }}
              />
              {/* Placeholder if image doesn't exist */}
              <div className="bg-gradient-to-br from-navy-100 to-navy-200 rounded-2xl h-96 flex items-center justify-center shadow-medium">
                <Gavel className="h-32 w-32 text-primary opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-gradient-secondary section">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center text-slate-900 mb-12">
            Everything You Need for Legal Support
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {/* AI Assistant Feature */}
            <div className="card-interactive bg-gradient-to-br from-navy-50 to-navy-100 border-navy-200">
              <MessageSquare className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-display font-bold text-slate-900 mb-3">AI Legal Assistant</h3>
              <p className="text-slate-600 mb-4">
                Get instant answers to legal questions, 24/7. Our AI provides guidance and recommends next steps.
              </p>
              <Link to="/ai" className="text-primary font-semibold hover:text-navy-700 inline-flex items-center transition-colors">
                Try it free <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Lawyers Feature */}
            <div className="card-interactive bg-gradient-to-br from-navy-50 to-slate-100 border-slate-200">
              <Gavel className="h-12 w-12 text-secondary mb-4" />
              <h3 className="text-xl font-display font-bold text-slate-900 mb-3">Expert Lawyers</h3>
              <p className="text-slate-600 mb-4">
                Book video consultations with verified lawyers. Browse profiles, ratings, and specializations.
              </p>
              <Link to="/lawyers" className="text-secondary font-semibold hover:text-slate-900 inline-flex items-center transition-colors">
                Find lawyers <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            {/* Marketplace Feature */}
            <div className="card-interactive bg-gradient-to-br from-gold-100 to-gold-200 border-gold-300">
              <ShoppingBag className="h-12 w-12 text-accent mb-4" />
              <h3 className="text-xl font-display font-bold text-slate-900 mb-3">Legal Documents</h3>
              <p className="text-slate-700 mb-4">
                Access professional legal templates and documents. Download instantly after purchase.
              </p>
              <Link to="/marketplace" className="text-accent font-semibold hover:text-gold-700 inline-flex items-center transition-colors">
                Browse marketplace <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Lawyers Section */}
      <section id="lawyers" className="section bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
              Featured Lawyers
            </h2>
            <p className="text-xl text-slate-600">
              Connect with verified legal experts in your area
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {/* Sample Lawyer Cards */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-interactive">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-navy-500 to-navy-700 rounded-full flex items-center justify-center text-white font-display font-bold text-xl shadow-medium">
                      AD
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg text-slate-900">Advocate Name</h3>
                      <p className="text-sm text-slate-600">Corporate Law</p>
                    </div>
                  </div>
                  <div className="badge-warning flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-600 fill-current" />
                    <span className="text-sm font-semibold">4.8</span>
                  </div>
                </div>
                <div className="flex items-center text-sm text-slate-600 mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  Nairobi, Kenya
                </div>
                <p className="text-slate-600 text-sm mb-4">
                  15+ years experience in corporate law, mergers & acquisitions...
                </p>
                <Link to="/login" className="btn-primary block text-center">
                  Book Consultation
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/lawyers" className="inline-flex items-center text-primary font-semibold hover:text-navy-700 transition-colors">
              View all lawyers <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section id="resources" className="section bg-gradient-secondary">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-slate-900 mb-4">
              Legal Resources & Guides
            </h2>
            <p className="text-xl text-slate-600">
              Free articles, guides, and legal information
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Understanding Property Law in Kenya", category: "Real Estate" },
              { title: "Small Business Legal Requirements", category: "Business Law" },
              { title: "Family Law: What You Need to Know", category: "Family Law" }
            ].map((article, i) => (
              <div key={i} className="card hover:shadow-large transition-shadow">
                <div className="flex items-center space-x-2 mb-3">
                  <BookOpen className="h-5 w-5 text-primary" />
                  <span className="badge-primary text-sm">{article.category}</span>
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 mb-3">{article.title}</h3>
                <p className="text-slate-600 text-sm mb-4">
                  Learn about the key aspects and requirements...
                </p>
                <Link to="/resources" className="text-primary font-semibold hover:text-navy-700 text-sm transition-colors">
                  Read more →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-navy-600 to-navy-800 section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Ready to Get Legal Help?
          </h2>
          <p className="text-xl text-navy-100 mb-8">
            Start with our free AI assistant or book a consultation with an expert lawyer
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/ai" className="bg-white text-primary px-8 py-4 rounded-xl hover:bg-slate-50 transition-colors text-lg font-semibold shadow-large hover:shadow-glow">
              Try AI Assistant
            </Link>
            <Link to="/register" className="bg-navy-700 text-white px-8 py-4 rounded-xl hover:bg-navy-900 transition-colors text-lg font-semibold border-2 border-white shadow-large">
              Create Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12">
        <div className="container">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Gavel className="h-6 w-6 text-navy-400" />
                <span className="text-xl font-display font-bold text-white">Wakili Pro</span>
              </div>
              <p className="text-sm">
                Legal Excellence - Your trusted platform for legal services in Kenya.
              </p>
            </div>
            <div>
              <h4 className="font-display font-bold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/ai" className="hover:text-white transition-colors">AI Assistant</Link></li>
                <li><Link to="/lawyers" className="hover:text-white transition-colors">Find Lawyers</Link></li>
                <li><Link to="/marketplace" className="hover:text-white transition-colors">Marketplace</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-white mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link to="/resources" className="hover:text-white transition-colors">Legal Guides</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">FAQs</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 text-center text-sm">
            <p>&copy; 2025 Wakili Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
