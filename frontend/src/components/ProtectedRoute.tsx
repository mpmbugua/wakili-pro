import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  subscriptionStatus?: string | null;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireSubscription, subscriptionStatus }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  if (!isAuthenticated) {
    // Redirect to homepage where login modal can be opened
    return <Navigate to="/" replace />;
  }

  if (requireSubscription && subscriptionStatus !== 'ACTIVE') {
    return <Navigate to="/subscribe" replace />;
  }

  return <>{children}</>;
};
