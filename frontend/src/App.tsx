import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './store/authStore';
import { LandingPage } from './pages/LandingPage';
import { AIAssistant } from './pages/AIAssistant';
import { LawyersBrowse } from './pages/LawyersBrowse';
import { MarketplaceBrowse } from './pages/MarketplaceBrowse';
import Login from './components/auth/Login';
import Register from './components/auth/Register';

const GOOGLE_CLIENT_ID = '635497798070-n4kun3d5m7af6k4cbcmvoeehlp3igh68.apps.googleusercontent.com';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  console.log('[ProtectedRoute] isAuthenticated:', isAuthenticated);
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const { isAuthenticated, refreshAuth, accessToken, logout } = useAuthStore();

  useEffect(() => {
    // Try to refresh auth on app load if we have tokens
    if (!isAuthenticated && accessToken) {
      refreshAuth();
    }
  }, [isAuthenticated, accessToken, refreshAuth]);

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
      <Routes>
        {/* Public Routes - No Authentication Required */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/ai" element={<AIAssistant />} />
        <Route path="/lawyers" element={<LawyersBrowse />} />
        <Route path="/marketplace" element={<MarketplaceBrowse />} />
        
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} 
        />

        {/* Protected Routes - Authentication Required */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <div style={{ padding: '40px', fontFamily: 'Arial' }}>
                <h1 style={{ fontSize: '32px', marginBottom: '20px' }}>✅ Welcome to Your Dashboard</h1>
                <p style={{ fontSize: '18px', marginBottom: '20px' }}>You are successfully logged in!</p>
                <button 
                  onClick={() => logout()} 
                  style={{ 
                    padding: '12px 24px', 
                    fontSize: '16px', 
                    backgroundColor: '#dc2626', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '8px', 
                    cursor: 'pointer' 
                  }}
                >
                  Logout
                </button>
              </div>
            </ProtectedRoute>
          } 
        />

        {/* Catch-all - redirect to landing */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
