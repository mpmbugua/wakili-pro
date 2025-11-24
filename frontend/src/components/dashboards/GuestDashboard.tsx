import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, MessageSquare, FileText, BookOpen, Scale, Video } from 'lucide-react';
import { Button } from '../ui/Button';
import { PageHeader } from '../ui';

export const GuestDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <PageHeader
        title="Welcome to Wakili Pro"
        subtitle="Guest User"
        description="Create an account to access legal services and connect with professional lawyers"
        actions={
          <>
            <Button variant="outline" onClick={() => navigate('/register')}>
              Sign Up
            </Button>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Log In
            </Button>
          </>
        }
      />

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Scale className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Find Expert Lawyers</h3>
          <p className="text-gray-600 text-sm mb-4">
            Browse our network of verified legal professionals specialized in various practice areas
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/lawyers')}>
            Browse Lawyers
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Legal Assistant</h3>
          <p className="text-gray-600 text-sm mb-4">
            Get instant answers to basic legal questions using our AI-powered assistant
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/ai')}>
            Try AI Assistant
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Documents</h3>
          <p className="text-gray-600 text-sm mb-4">
            Access professionally drafted legal document templates for various needs
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/marketplace')}>
            View Documents
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-4">
            <BookOpen className="h-6 w-6 text-amber-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Resources</h3>
          <p className="text-gray-600 text-sm mb-4">
            Learn about your rights and legal processes with our comprehensive guides
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/resources')}>
            Explore Resources
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="w-12 h-12 bg-rose-100 rounded-lg flex items-center justify-center mb-4">
            <Video className="h-6 w-6 text-rose-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Consultations</h3>
          <p className="text-gray-600 text-sm mb-4">
            Schedule secure video consultations with lawyers from anywhere
          </p>
          <Button variant="outline" size="sm" disabled>
            Sign up to access
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Community Support</h3>
          <p className="text-gray-600 text-sm mb-4">
            Join discussions and get insights from legal professionals and peers
          </p>
          <Button variant="outline" size="sm" disabled>
            Sign up to join
          </Button>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-8 text-white">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-bold mb-3">Ready to Get Started?</h2>
          <p className="text-blue-100 mb-6">
            Create a free account to access all features, connect with lawyers, and manage your legal matters efficiently.
          </p>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => navigate('/register')}>
              Create Free Account
            </Button>
            <Button variant="outline" className="text-white border-white hover:bg-white/10" onClick={() => navigate('/lawyers')}>
              Explore First
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
