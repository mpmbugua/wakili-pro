import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { MainLayout } from './components/layout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard';
import LawyerOnboarding from './components/lawyer/LawyerOnboarding';
import { VideoConsultationPage } from './pages/VideoConsultationPage';
import { AdminRoute } from './components/admin/AdminRoute';
import {
  AdminDashboard,
  UserManagement,
  LawyerVerification,
  AdminAnalyticsDashboard,
  SystemAdministration
} from './components/admin';

// Protected Route component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

function App() {
  const { isAuthenticated, refreshAuth, accessToken } = useAuthStore();

  useEffect(() => {
    // Try to refresh auth on app load if we have tokens but no current auth
    if (!isAuthenticated && accessToken) {
      refreshAuth();
    }
  }, [isAuthenticated, accessToken, refreshAuth]);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
            } 
          />
          <Route 
            path="/register" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />
            } 
          />

          {/* Protected routes with layout */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <Dashboard />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lawyer/onboarding" 
            element={
              <ProtectedRoute>
                <MainLayout>
                  <LawyerOnboarding />
                </MainLayout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/consultation/:consultationId/video" 
            element={
              <ProtectedRoute>
                <VideoConsultationPage />
              </ProtectedRoute>
            } 
          />

          {/* Admin routes with layout */}
          <Route 
            path="/admin" 
            element={
              <AdminRoute>
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/dashboard" 
            element={
              <AdminRoute>
                <MainLayout>
                  <AdminDashboard />
                </MainLayout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/users" 
            element={
              <AdminRoute>
                <MainLayout>
                  <UserManagement />
                </MainLayout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/lawyers" 
            element={
              <AdminRoute>
                <MainLayout>
                  <LawyerVerification />
                </MainLayout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/analytics" 
            element={
              <AdminRoute>
                <MainLayout>
                  <AdminAnalyticsDashboard />
                </MainLayout>
              </AdminRoute>
            } 
          />
          <Route 
            path="/admin/settings" 
            element={
              <AdminRoute>
                <MainLayout>
                  <SystemAdministration />
                </MainLayout>
              </AdminRoute>
            } 
          />

          {/* Default redirect */}
          <Route 
            path="/" 
            element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
            } 
          />

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App