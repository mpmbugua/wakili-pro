import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { WakiliLogo } from './components/ui/WakiliLogo';
import BackendTest from './components/BackendTest';

// Simplified Landing Page Component
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <WakiliLogo />
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Wakili Pro</h1>
            </div>
            <div className="space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Login
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                Register
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
            Professional Legal Services Platform
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Connect with qualified lawyers for consultations, document reviews, and legal representation in Kenya.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors">
              Find a Lawyer
            </button>
            <button className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-700 transition-colors">
              Join as Lawyer
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              📞
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Video Consultations</h3>
            <p className="text-gray-600">Schedule and conduct secure video calls with lawyers</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              📄
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Review</h3>
            <p className="text-gray-600">Get your legal documents reviewed by qualified professionals</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              💼
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Legal Marketplace</h3>
            <p className="text-gray-600">Browse and purchase legal services at transparent prices</p>
          </div>
        </div>

        {/* Backend Status */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">System Status</h2>
          <BackendTest />
        </div>
      </main>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/test" element={<BackendTest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;