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
  Users,
  CheckCircle,
  FileText,
  TrendingUp,
  Home,
  Briefcase,
  GraduationCap,
  Newspaper
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar - FB Style */}
      <header className="sticky top-0 z-50 bg-[#f0f2f5] border-b border-slate-300 shadow-sm">
        <div className="px-4">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="bg-blue-600 p-1.5 rounded">
                  <Gavel className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-slate-900">
                  Wakili Pro
                </span>
              </div>
              <nav className="hidden lg:flex space-x-1">
                <a href="#services" className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                  Services
                </a>
                <a href="#lawyers" className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                  Lawyers
                </a>
                <a href="#resources" className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                  Resources
                </a>
                <a href="#insights" className="px-4 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                  Insights
                </a>
              </nav>
            </div>
            <div className="flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  <span className="text-xs text-slate-700">Hi, {user?.firstName}</span>
                  <Link 
                    to="/dashboard" 
                    className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={async () => {
                      await useAuthStore.getState().logout();
                      window.location.reload();
                    }}
                    className="px-3 py-1.5 text-xs border border-slate-300 text-slate-700 rounded hover:bg-slate-200 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-sm text-slate-700 hover:text-blue-600 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout with Sidebar */}
      <div className="flex">
        {/* Left Sidebar - FB Style */}
        <aside className="hidden lg:block w-64 fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-[#f0f2f5] border-r border-slate-300 overflow-y-auto">
          <div className="p-3">
            <nav className="space-y-1">
              <a href="#services" className="flex items-center space-x-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </a>
              <a href="#services" className="flex items-center space-x-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                <MessageSquare className="h-5 w-5" />
                <span>AI Legal Assistant</span>
              </a>
              <a href="#services" className="flex items-center space-x-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                <Gavel className="h-5 w-5" />
                <span>Expert Lawyers</span>
              </a>
              <a href="#services" className="flex items-center space-x-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                <ShoppingBag className="h-5 w-5" />
                <span>Legal Documents</span>
              </a>
              <div className="border-t border-slate-300 my-3"></div>
              <a href="#lawyers" className="flex items-center space-x-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                <Users className="h-5 w-5" />
                <span>Featured Lawyers</span>
              </a>
              <a href="#resources" className="flex items-center space-x-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                <BookOpen className="h-5 w-5" />
                <span>Legal Resources</span>
              </a>
              <a href="#insights" className="flex items-center space-x-3 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 rounded-lg transition-colors">
                <Newspaper className="h-5 w-5" />
                <span>Insights & Analysis</span>
              </a>
              <div className="border-t border-slate-300 my-3"></div>
              <Link to="/ai" className="flex items-center space-x-3 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                <MessageSquare className="h-5 w-5" />
                <span>Try AI Assistant</span>
              </Link>
              <Link to="/lawyers" className="flex items-center space-x-3 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                <Briefcase className="h-5 w-5" />
                <span>Browse Lawyers</span>
              </Link>
              <Link to="/marketplace" className="flex items-center space-x-3 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors font-medium">
                <FileText className="h-5 w-5" />
                <span>Browse Documents</span>
              </Link>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 lg:ml-64">
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
              
              {/* Three Service Cards - Shown Once */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* AI Assistant */}
                <div className="bg-white rounded border border-slate-300 p-5 hover:border-blue-400 hover:shadow-sm transition-all">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">AI Legal Assistant</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">
                    Get instant answers to legal questions, 24/7. AI-powered guidance based on Kenyan law.
                  </p>
                  <Link 
                    to="/ai" 
                    className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center font-medium"
                  >
                    Try for free <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>

                {/* Expert Lawyers */}
                <div className="bg-white rounded border border-slate-300 p-5 hover:border-blue-400 hover:shadow-sm transition-all">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <Gavel className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Expert Lawyers</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">
                    Book video consultations with 500+ verified advocates across all practice areas.
                  </p>
                <Link 
                  to="/lawyers" 
                  className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center font-medium"
                >
                  Browse lawyers <ArrowRight className="ml-1 h-3 w-3" />
                </Link>                {/* Legal Documents */}
                <div className="bg-white rounded border border-slate-300 p-5 hover:border-blue-400 hover:shadow-sm transition-all">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-50 p-2 rounded">
                      <ShoppingBag className="h-5 w-5 text-blue-600" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-900">Legal Documents</h3>
                  </div>
                  <p className="text-xs text-slate-600 mb-4">
                    Access 500+ professional legal templates and documents. Download instantly.
                  </p>
                  <Link 
                    to="/marketplace" 
                    className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center font-medium"
                  >
                    Browse docs <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Featured Lawyers Section */}
          <section id="lawyers" className="py-8 bg-[#f0f2f5] border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  Featured Lawyers
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
              { name: 'Adv. Grace Njeri', specialty: 'Real Estate Law', location: 'Nairobi', rating: 4.7, cases: '180+' }
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
                  className="block w-full text-center px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
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

          {/* Legal Resources & Guides Section */}
          <section id="resources" className="py-8 bg-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  Legal Resources & Guides
                </h2>
                <p className="text-xs text-slate-600">
                  Free information to help you understand Kenyan law
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: "Property Law Guide", category: "Real Estate", icon: BookOpen },
              { title: "Business Registration Steps", category: "Corporate", icon: TrendingUp },
              { title: "Employment Law Basics", category: "Labour", icon: Users },
              { title: "Legal Document Templates", category: "Documents", icon: FileText }
              ].map((resource, i) => (
                <div key={i} className="bg-white rounded border border-slate-300 p-4 hover:border-blue-400 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                    {resource.category}
                  </span>
                  <resource.icon className="h-4 w-4 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  {resource.title}
                </h3>
                <Link 
                  to="/resources" 
                  className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center font-medium"
                >
                  Read guide <ArrowRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
            ))}
          </div>
            </div>
          </section>

          {/* Insights & Analysis (Thought Leadership) */}
          <section id="insights" className="py-8 bg-[#f0f2f5] border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900 mb-1">
                  Insights & Analysis
                </h2>
                <p className="text-xs text-slate-600">
                  Expert commentary on legal developments in Kenya
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
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
            </div>
          </section>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800 lg:ml-64">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-6">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="bg-blue-600 p-1.5 rounded">
                  <Gavel className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-semibold text-white">Wakili Pro</span>
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
                  <a href="#" className="hover:text-white transition-colors">
                    FAQs
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Blog
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white text-xs font-semibold mb-3">Company</h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </a>
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
    </div>
  );
};
