import React, { useEffect } from 'react';
import { EmergencyCallButton } from './components/EmergencyCallButton';
import { AnalyticsTracker } from './components/AnalyticsTracker';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useAuthStore } from './store/authStore';
import { usePageTracking, useScrollTracking } from './hooks/useAnalytics';
import { AppShell } from './components/layout/AppShell';
import { GlobalLayout } from './components/layout/GlobalLayout';
import { LandingPage } from './pages/LandingPage';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { FAQPage } from './pages/FAQPage';
import { BlogPage } from './pages/BlogPage';
import { SubmitArticlePage } from './pages/SubmitArticlePage';
import { AIAssistant } from './pages/AIAssistant';
import { LawyerAIAssistant } from './pages/LawyerAIAssistant';
import { AdminAIAssistant } from './pages/AdminAIAssistant';
import { LawyersBrowse } from './pages/LawyersBrowse';
import { MarketplaceBrowse } from './pages/MarketplaceBrowse';
import { ResourcesPage } from './pages/ResourcesPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import { ServicesPage } from './pages/ServicesPage';
import { LegalServicesPage } from './pages/LegalServicesPage';
import { BookingPage } from './pages/BookingPage';
import { PaymentPage } from './pages/PaymentPage';
import PaymentCallbackPage from './pages/PaymentCallbackPage';
import { LawyerProfileSettings } from './pages/LawyerProfileSettings';
import LawyerOnboarding from './pages/LawyerOnboarding';
import LawyerProfile from './pages/LawyerProfile';
import DocumentServicesPage from './pages/DocumentServicesPage';
import LawyerSignatureSetup from './pages/LawyerSignatureSetup';
import DocumentCertificationPage from './pages/DocumentCertificationPage';
import VerifyCertificate from './pages/VerifyCertificate';
import ServiceRequestPage from './pages/ServiceRequestPage';
import LawyerWalletPage from './pages/LawyerWalletPage';
import UpgradePage from './pages/UpgradePage';
import LawyerQuoteSubmissionPage from './pages/LawyerQuoteSubmissionPage';
import QuoteComparisonPage from './pages/QuoteComparisonPage';
import ServiceTrackingPage from './pages/ServiceTrackingPage';
import { SettingsPage } from './pages/SettingsPage';
import { HelpPage } from './pages/HelpPage';
import { MyClientsPage } from './pages/MyClientsPage';
import { NewClientPage } from './pages/NewClientPage';
import { MyServicesPage } from './pages/MyServicesPage';
import { BillingPage } from './pages/BillingPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { PerformancePage } from './pages/PerformancePage';
import { PublicLawyerProfile } from './pages/PublicLawyerProfile';
import ConsultationsPage from './pages/ConsultationsPage';
import { NewConsultationPage } from './pages/NewConsultationPage';
import { CalendarPage } from './pages/CalendarPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import MessagesPage from './pages/MessagesPage';
import DocumentsPage from './pages/DocumentsPage';
import { DocumentReviewRequestPage } from './pages/DocumentReviewRequestPage';
import DocumentReviewDashboard from './pages/DocumentReviewDashboard';
import { ArticleManagementPage } from './pages/admin/ArticleManagementPage';
import { AdminLawyerApproval } from './pages/admin/AdminLawyerApproval';
import AdminWithdrawalManagement from './pages/admin/AdminWithdrawalManagement';
import AdminLegalKnowledgeBase from './pages/admin/AdminLegalKnowledgeBase';
import { PineconeTestPage } from './pages/admin/PineconeTestPage';
import { CallLogPage } from './pages/admin/CallLogPage';
import { AnalyticsDashboard } from './pages/admin/AnalyticsDashboard';
import { AIDataExportPage } from './pages/admin/AIDataExportPage';
import { VoipCallPage } from './pages/VoipCallPage';
import { VideoConsultationPage } from './pages/VideoConsultationPage';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { SuperAdminDashboard } from './components/dashboards/SuperAdminDashboard';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import Dashboard from './components/Dashboard';
import { MyBookings } from './components/MyBookings';
import { BookingDetails } from './components/BookingDetails';
import { VerifiedLawyerRoute } from './components/VerifiedLawyerRoute';

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
    // Don't use replace - allow back button to work
    return <Navigate to="/login" />;
  }
  
  return <>{children}</>;
};

// Admin Route component for admin-only pages
const AdminRoute: React.FC<{ children: React.ReactNode; hydrated: boolean }> = ({ children, hydrated }) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  
  // Debug logging
  React.useEffect(() => {
    console.log('[AdminRoute]', { 
      path: location.pathname,
      hydrated, 
      isAuthenticated, 
      userRole: user?.role 
    });
  }, [location.pathname, hydrated, isAuthenticated, user?.role]);
  
  if (!hydrated) {
    return null;
  }
  
  if (!isAuthenticated || !user) {
    console.log('[AdminRoute] Not authenticated, redirecting to /admin/login');
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    console.log('[AdminRoute] User role not admin:', user.role, 'redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }
  
  console.log('[AdminRoute] Access granted for', user.role);
  return <>{children}</>;
};

// Super Admin Route component for super admin only pages
const SuperAdminRoute: React.FC<{ children: React.ReactNode; hydrated: boolean }> = ({ children, hydrated }) => {
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  
  if (!hydrated) {
    return null;
  }
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }
  
  if (user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Wrapper components to inject user prop safely
const AdminDashboardWrapper: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;
  return <AdminDashboard user={user} />;
};

const SuperAdminDashboardWrapper: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  if (!user) return null;
  return <SuperAdminDashboard user={user} />;
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
        <AnalyticsTracker />
        <Routes>
          {/* Standalone Routes (No Layout) - MUST BE FIRST */}
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/voip-call" element={<VoipCallPage />} />

          {/* Public Routes with GlobalLayout */}
          <Route path="/" element={<GlobalLayout><LandingPage /></GlobalLayout>} />
          <Route path="/about" element={<GlobalLayout><AboutPage /></GlobalLayout>} />
          <Route path="/contact" element={<GlobalLayout><ContactPage /></GlobalLayout>} />
          <Route path="/privacy" element={<GlobalLayout><PrivacyPolicyPage /></GlobalLayout>} />
          <Route path="/terms" element={<GlobalLayout><TermsOfServicePage /></GlobalLayout>} />
          <Route path="/faq" element={<GlobalLayout><FAQPage /></GlobalLayout>} />
          <Route path="/blog" element={<GlobalLayout><BlogPage /></GlobalLayout>} />
          <Route path="/ai" element={<GlobalLayout><AIAssistant /></GlobalLayout>} />
          <Route path="/lawyers" element={<GlobalLayout><LawyersBrowse /></GlobalLayout>} />
          <Route path="/lawyers/:lawyerId" element={<PublicLawyerProfile />} />
          <Route path="/services" element={<GlobalLayout><LegalServicesPage /></GlobalLayout>} />
          <Route path="/marketplace" element={<GlobalLayout><MarketplaceBrowse /></GlobalLayout>} />
          <Route path="/resources" element={<GlobalLayout><ResourcesPage /></GlobalLayout>} />
          <Route path="/documents" element={<GlobalLayout><DocumentsPage /></GlobalLayout>} />
          <Route path="/resources/article/:id" element={<GlobalLayout><ArticleDetailPage /></GlobalLayout>} />
          <Route path="/document-services" element={<GlobalLayout><DocumentServicesPage /></GlobalLayout>} />
          <Route path="/service-request" element={<GlobalLayout><ServiceRequestPage /></GlobalLayout>} />
          <Route path="/booking/:lawyerId" element={<GlobalLayout><BookingPage /></GlobalLayout>} />
          <Route path="/payment/document/:purchaseId" element={<GlobalLayout><PaymentPage /></GlobalLayout>} />
          <Route path="/payment-callback" element={<GlobalLayout><PaymentCallbackPage /></GlobalLayout>} />
          <Route path="/verify/:certificateId" element={<GlobalLayout><VerifyCertificate /></GlobalLayout>} />
          <Route path="/verify" element={<GlobalLayout><VerifyCertificate /></GlobalLayout>} />
          
          {/* Auth Routes */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <GlobalLayout><Login /></GlobalLayout>} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/dashboard" /> : <GlobalLayout><Register /></GlobalLayout>} 
          />
          <Route 
            path="/forgot-password" 
            element={<ForgotPassword />} 
          />
          <Route 
            path="/reset-password" 
            element={<ResetPassword />} 
          />
            
            {/* Service Request Quote Routes (Protected with AppShell) */}
            <Route 
              path="/service-requests/:id/quote" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <LawyerQuoteSubmissionPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/service-requests/:id/quotes" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <QuoteComparisonPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/service-requests/:id/track" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <ServiceTrackingPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />

            {/* Protected Dashboard Routes with AppShell */}
            <Route 
              path="/dashboard" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <Dashboard />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/bookings" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <MyBookings />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/bookings/:bookingId" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <BookingDetails />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/profile/settings" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <LawyerProfileSettings />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/calendar" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <CalendarPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/subscriptions" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <SubscriptionsPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <SettingsPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/help" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <HelpPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/submit-article" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <SubmitArticlePage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/clients" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <MyClientsPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/my-services" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <MyServicesPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/billing" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <BillingPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <AnalyticsPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/performance" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <PerformancePage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/consultations" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <ConsultationsPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/consultations/new" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <NewConsultationPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/consultation/:consultationId/video" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <VideoConsultationPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/clients/new" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <NewClientPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/lawyer/ai" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <LawyerAIAssistant />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/admin/ai" 
              element={
                <AppShell>
                  <AdminRoute hydrated={hydrated}>
                    <AdminAIAssistant />
                  </AdminRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/appointments" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <AppointmentsPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/messages" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <MessagesPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/documents/:documentId/request-review" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <DocumentReviewRequestPage />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/document-reviews" 
              element={
                <AppShell>
                  <VerifiedLawyerRoute>
                    <DocumentReviewDashboard />
                  </VerifiedLawyerRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/lawyer/onboarding" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <LawyerOnboarding />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/lawyer/profile" 
              element={
                <AppShell>
                  <ProtectedRoute hydrated={hydrated}>
                    <LawyerProfile />
                  </ProtectedRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/lawyer/signature-setup" 
              element={
                <AppShell>
                  <VerifiedLawyerRoute>
                    <LawyerSignatureSetup />
                  </VerifiedLawyerRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/lawyer/certifications" 
              element={
                <AppShell>
                  <VerifiedLawyerRoute>
                    <DocumentCertificationPage />
                  </VerifiedLawyerRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/lawyer/wallet" 
              element={
                <AppShell>
                  <VerifiedLawyerRoute>
                    <LawyerWalletPage />
                  </VerifiedLawyerRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/lawyer/upgrade" 
              element={
                <AppShell>
                  <VerifiedLawyerRoute>
                    <UpgradePage />
                  </VerifiedLawyerRoute>
                </AppShell>
              } 
            />
            
            {/* Admin Routes with AppShell */}
            <Route 
              path="/admin" 
              element={
                <AppShell>
                  <AdminRoute hydrated={hydrated}>
                    <AdminDashboardWrapper />
                  </AdminRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/admin/analytics" 
              element={
                <AppShell>
                  <AdminRoute hydrated={hydrated}>
                    <AnalyticsDashboard />
                  </AdminRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/admin/ai-data-export" 
              element={
                <AppShell>
                  <AdminRoute hydrated={hydrated}>
                    <AIDataExportPage />
                  </AdminRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/admin/articles" 
              element={
                <AppShell>
                  <AdminRoute hydrated={hydrated}>
                    <ArticleManagementPage />
                  </AdminRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/admin/lawyers" 
              element={
                <AppShell>
                  <AdminRoute hydrated={hydrated}>
                    <AdminLawyerApproval />
                  </AdminRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/admin/withdrawals" 
              element={
                <AppShell>
                  <AdminRoute hydrated={hydrated}>
                    <AdminWithdrawalManagement />
                  </AdminRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/admin/legal-knowledge" 
              element={
                <AppShell>
                  <AdminRoute hydrated={hydrated}>
                    <AdminLegalKnowledgeBase />
                  </AdminRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/admin/pinecone-test" 
              element={
                <AppShell>
                  <AdminRoute hydrated={hydrated}>
                    <PineconeTestPage />
                  </AdminRoute>
                </AppShell>
              } 
            />
            <Route 
              path="/admin/call-logs" 
              element={
                <AppShell>
                  <AdminRoute hydrated={hydrated}>
                    <CallLogPage />
                  </AdminRoute>
                </AppShell>
              } 
            />

            {/* Super Admin Routes with AppShell */}
            <Route 
              path="/super-admin" 
              element={
                <AppShell>
                  <SuperAdminRoute hydrated={hydrated}>
                    <SuperAdminDashboardWrapper />
                  </SuperAdminRoute>
                </AppShell>
              } 
            />

            {/* Catch-all - redirect to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      <EmergencyCallButton />
    </GoogleOAuthProvider>
  );
}

export default App;
