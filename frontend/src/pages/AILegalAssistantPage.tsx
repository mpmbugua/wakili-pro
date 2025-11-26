import React from 'react';
import AILegalAssistant from '../components/ai/AILegalAssistant';
import { Brain, Scale, Shield, Users, Book, MessageCircle } from 'lucide-react';

const AILegalAssistantPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/20 rounded-full">
                <Brain className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              AI Legal Assistant
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              Get instant legal guidance powered by Kenyan law. Ask questions, get answers, 
              and discover when you need professional legal help.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center bg-white/20 px-4 py-2 rounded-full">
                <Scale className="h-4 w-4 mr-2" />
                Based on Kenyan Law
              </div>
              <div className="flex items-center bg-white/20 px-4 py-2 rounded-full">
                <Shield className="h-4 w-4 mr-2" />
                Free Legal Information
              </div>
              <div className="flex items-center bg-white/20 px-4 py-2 rounded-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Voice & Text Support
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center">
            <div className="p-3 bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Book className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Knowledge</h3>
            <p className="text-gray-600 text-sm">
              Comprehensive understanding of Kenyan constitution, statutes, and case law
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Modal</h3>
            <p className="text-gray-600 text-sm">
              Ask questions by typing or speaking - get responses in text or audio
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Access</h3>
            <p className="text-gray-600 text-sm">
              5 questions daily for guests, 50 monthly for registered users
            </p>
          </div>
          
          <div className="text-center">
            <div className="p-3 bg-amber-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Users className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Referrals</h3>
            <p className="text-gray-600 text-sm">
              Smart recommendations to connect with qualified lawyers when needed
            </p>
          </div>
        </div>

        {/* AI Assistant Interface */}
        <AILegalAssistant />

        {/* Disclaimer Section */}
        <div className="mt-16 bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Shield className="h-6 w-6 text-amber-600 mt-1" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-2">Important Legal Disclaimer</h3>
              <div className="text-sm text-amber-700 space-y-2">
                <p>
                  <strong>This AI assistant provides general legal information only and is not a substitute for professional legal advice.</strong>
                </p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Information provided is based on general legal principles and may not apply to your specific situation</li>
                  <li>Laws change frequently and this AI may not reflect the most recent updates</li>
                  <li>For specific legal matters, always consult with a qualified lawyer licensed to practice in Kenya</li>
                  <li>No attorney-client relationship is created through use of this AI assistant</li>
                  <li>Wakili Pro and its AI assistant are not responsible for any decisions made based on this information</li>
                </ul>
                <p className="font-medium">
                  When in doubt, seek professional legal counsel through our marketplace of verified lawyers.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Professional Legal Help?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Connect with qualified lawyers in our marketplace for personalized legal advice, 
            document preparation, and representation.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button 
              onClick={() => navigate('/marketplace')}
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center space-x-2"
            >
              <Users className="h-5 w-5" />
              <span>Browse Lawyers</span>
            </button>
            <button 
              onClick={() => navigate('/auth/register')}
              className="bg-white text-indigo-600 border border-indigo-600 px-8 py-3 rounded-lg hover:bg-indigo-50 transition-colors"
            >
              Sign Up for More Queries
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AILegalAssistantPage;