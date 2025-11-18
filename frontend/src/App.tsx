import { useState, useEffect } from 'react';
<<<<<<< HEAD

export default function App() {
  const [backendStatus, setBackendStatus] = useState('Testing...');
  const [backendData, setBackendData] = useState(null);

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Alert Banner */}
        <div className="bg-orange-600 text-white text-center py-2 font-bold text-lg">
          🔧 VERCEL EXPLICIT PARAMS v9.0 - {new Date().toISOString()} - DEPLOY TEST! 🔧
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
                <a href="/ai-legal-assistant" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">AI Legal Assistant</a>
                <a href="/emergency-connect" className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">Emergency Connect</a>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Login</button>
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">Register</button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Routing */}
        <main className="max-w-7xl mx-auto px-4 py-12">
          <Routes>
            <Route path="/ai-legal-assistant" element={<AILegalAssistantPage />} />
            <Route path="/emergency-connect" element={<EmergencyConnectPage />} />
            {/* Add more routes as needed */}
            <Route path="*" element={
              <div className="text-center">
                <h1 className="text-3xl md:text-6xl font-bold text-gray-900">
                  🚀 Professional Legal Services Platform 🚀
                </h1>
                <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
                  Connect with qualified lawyers for consultations, document reviews, and legal representation in Kenya.
                </p>
                <div className="mt-10 flex justify-center gap-4 flex-wrap">
                  <a href="/ai-legal-assistant" className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700">AI Legal Assistant</a>
                  <a href="/emergency-connect" className="bg-red-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-red-700">Emergency Connect</a>
                </div>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
>>>>>>> 238a3aa (chore: initial commit - production build, type safety, and cleanup (Nov 17, 2025))
  );
}
// Node.js version fix - 11/11/2025 06:15:00
