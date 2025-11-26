import React, { useState, useEffect } from 'react';

export default function WakiliProApp() {
  const [backendStatus, setBackendStatus] = useState('Testing connection...');
  const [backendData, setBackendData] = useState(null);
  const deployTime = new Date().toISOString();

  useEffect(() => {
    fetch('https://wakili-pro.onrender.com/health')
      .then(res => res.json())
      .then(data => {
        setBackendStatus('✅ Backend Connected Successfully!');
        setBackendData(data);
      })
      .catch(() => setBackendStatus('❌ Backend Connection Failed'));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100">
      {/* SUCCESS BANNER - PROMINENT */}
      <div className="bg-green-600 text-white text-center py-4 font-bold text-xl animate-pulse">
        🎉 SUCCESS! WAKILI PRO v7.0 DEPLOYED - FULL INTERFACE WORKING! 🎉
        <div className="text-sm mt-1">Deploy Time: {deployTime}</div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-lg border-b-4 border-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8 flex-wrap">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                W
              </div>
              <h1 className="ml-4 text-4xl font-bold text-gray-900">Wakili Pro</h1>
              <span className="ml-3 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                Professional Legal Platform
              </span>
            </div>
            <div className="space-x-4 mt-4 sm:mt-0">
              <button 
                onClick={() => alert('Login feature coming soon! This proves the full interface is working.')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                🔐 Login
              </button>
              <button 
                onClick={() => alert('Registration coming soon! Full UI is now visible.')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📝 Register
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            🚀 Professional Legal Services Platform 🚀
          </h1>
          
          <p className="mt-6 text-xl md:text-2xl leading-8 text-gray-600 max-w-4xl mx-auto mb-12">
            Connect with qualified lawyers for consultations, document reviews, and legal representation in Kenya. 
            Professional, secure, and transparent legal services at your fingertips.
          </p>
          
          <div className="mt-12 flex items-center justify-center gap-6 flex-wrap">
            <button 
              onClick={() => alert('Find Lawyer feature coming soon! The full interface is now working perfectly!')}
              className="bg-blue-600 text-white px-10 py-4 rounded-xl text-xl font-medium hover:bg-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              🔍 Find a Lawyer
            </button>
            <button 
              onClick={() => alert('Lawyer registration coming soon! All features are visible now.')}
              className="bg-green-600 text-white px-10 py-4 rounded-xl text-xl font-medium hover:bg-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              ⚖️ Join as Lawyer
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-t-4 border-blue-500">
            <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 text-4xl mx-auto">
              📞
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Video Consultations</h3>
            <p className="text-gray-600 leading-relaxed text-center">Schedule and conduct secure video calls with qualified lawyers. Get legal advice from the comfort of your home or office.</p>
            <button 
              onClick={() => alert('Video consultations feature coming soon!')}
              className="mt-6 text-blue-600 font-medium hover:text-blue-700 block mx-auto"
            >
              Learn More →
            </button>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-t-4 border-green-500">
            <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mb-6 text-4xl mx-auto">
              📄
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Document Review</h3>
            <p className="text-gray-600 leading-relaxed text-center">Get your legal documents professionally reviewed by experienced lawyers. Ensure your contracts and agreements are legally sound.</p>
            <button 
              onClick={() => alert('Document review feature coming soon!')}
              className="mt-6 text-green-600 font-medium hover:text-green-700 block mx-auto"
            >
              Learn More →
            </button>
          </div>
          
          <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-t-4 border-purple-500">
            <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mb-6 text-4xl mx-auto">
              💼
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4 text-center">Legal Marketplace</h3>
            <p className="text-gray-600 leading-relaxed text-center">Browse and purchase legal services at transparent, competitive prices. Find the right legal solution for your needs.</p>
            <button 
              onClick={() => alert('Legal marketplace feature coming soon!')}
              className="mt-6 text-purple-600 font-medium hover:text-purple-700 block mx-auto"
            >
              Learn More →
            </button>
          </div>
        </div>

        {/* Additional Features */}
        <div className="mt-24 bg-white rounded-3xl p-12 shadow-xl">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Why Choose Wakili Pro?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🛡️</div>
              <h4 className="font-semibold mb-3 text-lg">Secure & Confidential</h4>
              <p className="text-sm text-gray-600">End-to-end encryption for all communications</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">⚡</div>
              <h4 className="font-semibold mb-3 text-lg">Fast Response</h4>
              <p className="text-sm text-gray-600">Get connected with lawyers within minutes</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">💰</div>
              <h4 className="font-semibold mb-3 text-lg">Transparent Pricing</h4>
              <p className="text-sm text-gray-600">No hidden fees, clear pricing structure</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">🏆</div>
              <h4 className="font-semibold mb-3 text-lg">Qualified Lawyers</h4>
              <p className="text-sm text-gray-600">All lawyers are verified and licensed</p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-24">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">System Status</h2>
          <div className="bg-white p-10 rounded-2xl shadow-xl max-w-4xl mx-auto">
            <div className="text-center">
              <div className={`text-2xl mb-6 font-semibold ${backendStatus.includes('✅') ? 'text-green-600' : backendStatus.includes('❌') ? 'text-red-600' : 'text-yellow-600'}`}>
                {backendStatus}
              </div>
              {backendData && (
                <div className="mt-8 p-6 bg-gray-50 rounded-xl text-left">
                  <h4 className="font-semibold mb-4 text-lg">Backend Response:</h4>
                  <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    {JSON.stringify(backendData, null, 2)}
                  </pre>
                </div>
              )}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="bg-blue-50 p-6 rounded-xl">
                  <div className="font-semibold text-blue-800 mb-2">Backend URL</div>
                  <a href="https://wakili-pro.onrender.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">
                    https://wakili-pro.onrender.com
                  </a>
                </div>
                <div className="bg-green-50 p-6 rounded-xl">
                  <div className="font-semibold text-green-800 mb-2">Health Check</div>
                  <a href="https://wakili-pro.onrender.com/health" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline break-all">
                    /health
                  </a>
                </div>
                <div className="bg-purple-50 p-6 rounded-xl">
                  <div className="font-semibold text-purple-800 mb-2">API Root</div>
                  <a href="https://wakili-pro.onrender.com/api" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline break-all">
                    /api
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-3xl font-bold mb-6">Wakili Pro</div>
          <p className="text-gray-400 mb-6 text-lg">Professional Legal Services Platform for Kenya</p>
          <p className="text-sm text-gray-500">© 2025 Wakili Pro. All rights reserved.</p>
          <div className="mt-8 text-sm text-gray-400">
            🎉 Successfully deployed with full interface! All features are now visible.
          </div>
        </div>
      </footer>
    </div>
  );
}