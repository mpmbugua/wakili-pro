import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './store/authStore';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { AIAssistant } from './pages/AIAssistant';
import { LawyersBrowse } from './pages/LawyersBrowse';
import { MarketplaceBrowse } from './pages/MarketplaceBrowse';
import { ResourcesPage } from './pages/ResourcesPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { LegalServicesPage } from './pages/LegalServicesPage';
import { BookingPage } from './pages/BookingPage';
import { PaymentPage } from './pages/PaymentPage';
import { LawyerProfileSettings } from './pages/LawyerProfileSettings';
import DocumentServicesPage from './pages/DocumentServicesPage';
import LawyerSignatureSetup from './pages/LawyerSignatureSetup';
import DocumentCertificationPage from './pages/DocumentCertificationPage';
import VerifyCertificate from './pages/VerifyCertificate';
import ServiceRequestPage from './pages/ServiceRequestPage';
import LawyerQuoteSubmissionPage from './pages/LawyerQuoteSubmissionPage';
import QuoteComparisonPage from './pages/QuoteComparisonPage';
import ServiceTrackingPage from './pages/ServiceTrackingPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';

const GOOGLE_CLIENT_ID = '635497798070-n4kun3d5m7af6k4cbcmvoeehlp3igh68.apps.googleusercontent.com';

// Protected Route component outside App to prevent recreation
const ProtectedRoute: React.FC<{ children: React.ReactNode; hydrated: boolean }> = ({ children, hydrated }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  
  // Wait for hydration before checking auth to prevent race conditions
  if (!hydrated) {
    return null;
  }
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshAuth = useAuthStore((state) => state.refreshAuth);
  const [hydrated, setHydrated] = React.useState(false);
  const hasAttemptedRefresh = React.useRef(false);

  useEffect(() => {
    // Wait for zustand to rehydrate from localStorage
    const timer = setTimeout(() => {
      setHydrated(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Try to refresh auth on app load if we have tokens
    if (hydrated && !isAuthenticated && accessToken && !hasAttemptedRefresh.current) {
      hasAttemptedRefresh.current = true;
      refreshAuth();
    }
  }, [hydrated, isAuthenticated, accessToken, refreshAuth]);

  // Show loading state while hydrating auth from localStorage
  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Wakili Pro...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <AppShell>
          <Routes>
            {/* Public Routes - No Authentication Required */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/ai" element={<AIAssistant />} />
            <Route path="/lawyers" element={<LawyersBrowse />} />
            <Route path="/services" element={<LegalServicesPage />} />
            <Route path="/marketplace" element={<MarketplaceBrowse />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/resources/article/:id" element={<ArticleDetailPage />} />
            <Route path="/document-services" element={<DocumentServicesPage />} />
            <Route path="/service-request" element={<ServiceRequestPage />} />
            
            {/* Lawyer Quote Submission (Protected) */}
            <Route 
              path="/service-requests/:id/quote" 
              element={
                <ProtectedRoute hydrated={hydrated}>
                  <LawyerQuoteSubmissionPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Quote Comparison (Protected) */}
            <Route 
              path="/service-requests/:id/quotes" 
              element={
                <ProtectedRoute hydrated={hydrated}>
                  <QuoteComparisonPage />
                </ProtectedRoute>
              } 
            />
            
            {/* Service Tracking (Protected) */}
            <Route 
              path="/service-requests/:id/track" 
              element={
                <ProtectedRoute hydrated={hydrated}>
                  <ServiceTrackingPage />
                </ProtectedRoute>
              } 
            />
            
            <Route path="/booking/:lawyerId" element={<BookingPage />} />
            <Route path="/payment/:bookingId" element={<PaymentPage />} />
            <Route path="/payment/document/:reviewId" element={<PaymentPage />} />
            
            {/* Public Certificate Verification */}
            <Route path="/verify/:certificateId" element={<VerifyCertificate />} />
            <Route path="/verify" element={<VerifyCertificate />} />
            
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
                <ProtectedRoute hydrated={hydrated}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/settings" 
              element={
                <ProtectedRoute hydrated={hydrated}>
                  <LawyerProfileSettings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lawyer/signature-setup" 
              element={
                <ProtectedRoute hydrated={hydrated}>
                  <LawyerSignatureSetup />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/lawyer/certifications" 
              element={
                <ProtectedRoute hydrated={hydrated}>
                  <DocumentCertificationPage />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
