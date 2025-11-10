import { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { UserProfile } from './components/UserProfile';
import { User, LogOut } from 'lucide-react';

// Fixed deployment time to prevent re-renders
const DEPLOY_TIME = new Date().toISOString();

export default function AuthenticatedWakiliApp() {
  const [backendStatus, setBackendStatus] = useState('Testing connection...');
  const [backendData, setBackendData] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    // Use the same API base URL for consistency
    const API_BASE = 'https://wakili-pro.onrender.com';
    
    fetch(`${API_BASE}/health`)
      .then(res => res.json())
      .then(data => {
        setBackendStatus('✅ Backend Connected Successfully!');
        setBackendData(data);
      })
      .catch(() => setBackendStatus('❌ Backend Connection Failed'));
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowProfile(false);
  };

  if (showProfile && isAuthenticated) {
    return <UserProfile />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      {/* SUCCESS BANNER */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white text-center py-6 font-bold text-2xl shadow-lg">
        🎉 WAKILI PRO - AUTHENTICATION SYSTEM ACTIVE! 🎉
        <div className="text-lg mt-2">Full-Stack Legal Services Platform</div>
        <div className="text-sm mt-1">Deploy: {DEPLOY_TIME}</div>
      </div>

      {/* Header */}
      <header className="bg-white shadow-xl border-b-4 border-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-8 flex-wrap">
            <div className="flex items-center">
              <div className="w-14 h-14 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-3xl shadow-xl">
                W
              </div>
              <h1 className="ml-4 text-5xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Wakili Pro
              </h1>
              <span className="ml-4 bg-green-100 text-green-800 px-4 py-2 rounded-full text-lg font-bold shadow-lg">
                🚀 FULL-STACK READY!
              </span>
            </div>
            
            {/* Authentication Section */}
            <div className="space-x-6 mt-4 sm:mt-0">
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => setShowProfile(true)}
                    className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-all duration-300 font-bold text-lg shadow-xl"
                  >
                    <User className="h-5 w-5" />
                    <span>{user.firstName} {user.lastName}</span>
                  </button>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 transition-all duration-300 font-bold text-lg shadow-xl"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => setShowLogin(true)}
                    className="bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
                  >
                    🔐 Login
                  </button>
                  <button 
                    onClick={() => setShowRegister(true)}
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all duration-300 font-bold text-lg shadow-xl hover:shadow-2xl transform hover:scale-105"
                  >
                    📝 Register
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-12 leading-tight">
            🚀 Professional Legal Services Platform 🚀
          </h1>
          
          <p className="mt-8 text-2xl md:text-3xl leading-relaxed text-gray-600 max-w-5xl mx-auto mb-16 font-medium">
            Connect with qualified lawyers for consultations, document reviews, and legal representation in Kenya. 
            Professional, secure, and transparent legal services at your fingertips.
          </p>
          
          {/* User Status */}
          {isAuthenticated ? (
            <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg mb-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center space-x-2">
                <User className="h-6 w-6" />
                <span className="font-semibold">
                  Welcome back, {user?.firstName}! You're logged in as a {user?.role.toLowerCase()}.
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-blue-100 border border-blue-400 text-blue-700 px-6 py-4 rounded-lg mb-8 max-w-2xl mx-auto">
              <span className="font-semibold">
                👋 Welcome! Please log in or register to access all features.
              </span>
            </div>
          )}
          
          <div className="mt-16 flex items-center justify-center gap-8 flex-wrap">
            <button 
              onClick={() => isAuthenticated ? alert('🔍 Find Lawyer feature - Coming soon!') : setShowLogin(true)}
              className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-12 py-6 rounded-2xl text-2xl font-bold hover:from-green-700 hover:to-blue-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105"
            >
              🔍 Find a Lawyer
            </button>
            <button 
              onClick={() => isAuthenticated && user?.role === 'LAWYER' ? alert('⚖️ Lawyer Dashboard - Coming soon!') : setShowRegister(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-6 rounded-2xl text-2xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105"
            >
              ⚖️ Join as Lawyer
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="bg-white p-10 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 border-t-8 border-green-500">
            <div className="w-24 h-24 bg-green-100 rounded-3xl flex items-center justify-center mb-8 text-5xl mx-auto shadow-lg">
              📞
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">Video Consultations</h3>
            <p className="text-gray-600 leading-relaxed text-center text-lg">Schedule and conduct secure video calls with qualified lawyers. Get legal advice from the comfort of your home or office.</p>
            <button 
              onClick={() => isAuthenticated ? alert('📞 Video Consultations - Feature coming soon!') : setShowLogin(true)}
              className="mt-8 text-green-600 font-bold hover:text-green-700 block mx-auto text-lg"
            >
              {isAuthenticated ? 'Schedule Consultation →' : 'Login to Access →'}
            </button>
          </div>
          
          <div className="bg-white p-10 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 border-t-8 border-blue-500">
            <div className="w-24 h-24 bg-blue-100 rounded-3xl flex items-center justify-center mb-8 text-5xl mx-auto shadow-lg">
              📄
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">Document Review</h3>
            <p className="text-gray-600 leading-relaxed text-center text-lg">Get your legal documents professionally reviewed by experienced lawyers. Ensure your contracts and agreements are legally sound.</p>
            <button 
              onClick={() => isAuthenticated ? alert('📄 Document Review - Feature coming soon!') : setShowLogin(true)}
              className="mt-8 text-blue-600 font-bold hover:text-blue-700 block mx-auto text-lg"
            >
              {isAuthenticated ? 'Upload Document →' : 'Login to Access →'}
            </button>
          </div>
          
          <div className="bg-white p-10 rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 border-t-8 border-purple-500">
            <div className="w-24 h-24 bg-purple-100 rounded-3xl flex items-center justify-center mb-8 text-5xl mx-auto shadow-lg">
              💼
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">Legal Marketplace</h3>
            <p className="text-gray-600 leading-relaxed text-center text-lg">Browse and purchase legal services at transparent, competitive prices. Find the right legal solution for your needs.</p>
            <button 
              onClick={() => isAuthenticated ? alert('💼 Legal Marketplace - Feature coming soon!') : setShowLogin(true)}
              className="mt-8 text-purple-600 font-bold hover:text-purple-700 block mx-auto text-lg"
            >
              {isAuthenticated ? 'Browse Services →' : 'Login to Access →'}
            </button>
          </div>
        </div>

        {/* Why Choose Wakili Pro */}
        <div className="mt-32 bg-gradient-to-r from-green-50 to-blue-50 rounded-3xl p-12 shadow-2xl">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Why Choose Wakili Pro?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="text-5xl mb-4">🛡️</div>
              <h4 className="font-bold text-xl mb-3">Secure & Confidential</h4>
              <p className="text-gray-600">End-to-end encryption for all communications</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="text-5xl mb-4">⚡</div>
              <h4 className="font-bold text-xl mb-3">Fast Response</h4>
              <p className="text-gray-600">Get connected with lawyers within minutes</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="text-5xl mb-4">💰</div>
              <h4 className="font-bold text-xl mb-3">Transparent Pricing</h4>
              <p className="text-gray-600">No hidden fees, clear pricing structure</p>
            </div>
            <div className="text-center p-6 bg-white rounded-2xl shadow-lg">
              <div className="text-5xl mb-4">🏆</div>
              <h4 className="font-bold text-xl mb-3">Qualified Lawyers</h4>
              <p className="text-gray-600">All lawyers are verified and licensed</p>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-32">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">System Status</h2>
          <div className="bg-white p-12 rounded-3xl shadow-2xl max-w-4xl mx-auto border-4 border-green-200">
            <div className="text-center">
              <div className="text-2xl mb-8 font-bold text-green-600">{backendStatus}</div>
              {backendData && (
                <div className="mt-8 p-6 bg-gray-50 rounded-2xl text-left shadow-inner">
                  <h4 className="font-bold text-xl mb-4 text-center">Backend Response:</h4>
                  <pre className="text-sm bg-gray-100 p-6 rounded-xl overflow-x-auto font-mono">
                    {JSON.stringify(backendData, null, 2)}
                  </pre>
                </div>
              )}
              
              {/* Authentication Status */}
              <div className="mt-8 p-6 bg-blue-50 rounded-2xl">
                <h4 className="font-bold text-xl mb-4">Authentication Status</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl">
                    <div className="font-bold text-blue-800 mb-2">Status</div>
                    <div className={`font-semibold ${isAuthenticated ? 'text-green-600' : 'text-gray-600'}`}>
                      {isAuthenticated ? '✅ Authenticated' : '❌ Not Authenticated'}
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl">
                    <div className="font-bold text-blue-800 mb-2">User Type</div>
                    <div className="font-semibold text-gray-700">
                      {user ? `${user.role} - ${user.firstName} ${user.lastName}` : 'Not logged in'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 text-lg">
                <div className="bg-blue-50 p-6 rounded-2xl shadow-lg">
                  <div className="font-bold text-blue-800 mb-3">Backend URL</div>
                  <a href="https://wakili-pro.onrender.com" target="_blank" className="text-blue-600 hover:underline break-all font-mono">
                    https://wakili-pro.onrender.com
                  </a>
                </div>
                <div className="bg-green-50 p-6 rounded-2xl shadow-lg">
                  <div className="font-bold text-green-800 mb-3">Authentication API</div>
                  <span className="text-green-600 break-all font-mono">
                    /api/auth/*
                  </span>
                </div>
                <div className="bg-purple-50 p-6 rounded-2xl shadow-lg">
                  <div className="font-bold text-purple-800 mb-3">Frontend Host</div>
                  <span className="text-purple-600 break-all font-mono">
                    Netlify Deployed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16 mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-4xl font-bold mb-6">Wakili Pro</div>
          <p className="text-xl text-gray-300 mb-6">Professional Legal Services Platform for Kenya</p>
          <p className="text-lg text-gray-400">© 2025 Wakili Pro. All rights reserved.</p>
          <div className="mt-8 text-2xl">🎉 Full-Stack Authentication System Active! 🎉</div>
        </div>
      </footer>

      {/* Authentication Modals */}
      {showLogin && (
        <LoginForm 
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => {
            setShowLogin(false);
            setShowRegister(true);
          }}
        />
      )}
      
      {showRegister && (
        <RegisterForm 
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => {
            setShowRegister(false);
            setShowLogin(true);
          }}
        />
      )}
    </div>
  );
}