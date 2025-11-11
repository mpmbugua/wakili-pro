import { useState, useEffect } from 'react';

export default function App() {
  const [backendStatus, setBackendStatus] = useState('Testing...');
  const [backendData, setBackendData] = useState(null);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Alert Banner */}
      <div className="bg-blue-600 text-white text-center py-2 font-bold text-lg">
        🚀 WORKFLOW CONFLICTS RESOLVED v7.0 - {new Date().toISOString()} - VERCEL DEPLOY! 🚀
      </div>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center flex-wrap">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                W
              </div>
              <h1 className="ml-3 text-2xl font-bold text-gray-900">Wakili Pro</h1>
            </div>
            <div className="space-x-4 mt-4 sm:mt-0">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Login
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                Register
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h1 className="text-3xl md:text-6xl font-bold text-gray-900">
            🚀 Professional Legal Services Platform 🚀
          </h1>
          
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with qualified lawyers for consultations, document reviews, and legal representation in Kenya.
          </p>
          
          <div className="mt-10 flex justify-center gap-4 flex-wrap">
            <button className="bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-700">
              Find a Lawyer
            </button>
            <button className="bg-green-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-green-700">
              Join as Lawyer
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-4xl mb-4">📞</div>
            <h3 className="text-lg font-semibold mb-2">Video Consultations</h3>
            <p className="text-gray-600">Schedule and conduct secure video calls with lawyers</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-semibold mb-2">Document Review</h3>
            <p className="text-gray-600">Get your legal documents reviewed by qualified professionals</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-4xl mb-4">💼</div>
            <h3 className="text-lg font-semibold mb-2">Legal Marketplace</h3>
            <p className="text-gray-600">Browse and purchase legal services at transparent prices</p>
          </div>
        </div>

        {/* Backend Status */}
        <div className="mt-16 bg-white p-6 rounded-lg shadow max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-4">System Status</h2>
          <div className="text-center">
            <p className="text-lg mb-4">{backendStatus}</p>
            {backendData && (
              <div className="bg-gray-100 p-4 rounded text-left">
                <pre className="text-sm">{JSON.stringify(backendData, null, 2)}</pre>
              </div>
            )}
            <div className="mt-4 text-sm text-gray-600">
              <p><strong>Backend:</strong> https://wakili-pro.onrender.com</p>
              <p><strong>Health:</strong> https://wakili-pro.onrender.com/health</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}