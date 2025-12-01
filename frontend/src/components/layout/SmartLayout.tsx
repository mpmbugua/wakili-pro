import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { GlobalLayout } from './GlobalLayout';
import { AppShell } from './AppShell';

interface SmartLayoutProps {
  children: React.ReactNode;
  forcePublic?: boolean; // Force public layout even when authenticated
}

/**
 * SmartLayout automatically chooses between GlobalLayout (public) and AppShell (authenticated)
 * based on the current route and authentication status.
 * 
 * - Public routes always use GlobalLayout
 * - Authenticated users on dashboard/private routes use AppShell
 * - Documents page uses the appropriate layout based on auth status
 */
export const SmartLayout: React.FC<SmartLayoutProps> = ({ children, forcePublic = false }) => {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  
  // Define public routes that always use GlobalLayout
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/ai',
    '/lawyers',
    '/marketplace',
    '/services',
    '/resources',
    '/booking',
    '/payment',
    '/service-request',
    '/document-services'
  ];
  
  const isPublicRoute = publicRoutes.some(route => 
    location.pathname === route || 
    location.pathname.startsWith(route + '/')
  );
  
  // Use GlobalLayout for:
  // 1. Public routes
  // 2. Non-authenticated users
  // 3. When explicitly forced to public
  if (isPublicRoute || !isAuthenticated || forcePublic) {
    return <GlobalLayout>{children}</GlobalLayout>;
  }
  
  // Use AppShell for authenticated users on dashboard/private routes
  return <AppShell>{children}</AppShell>;
};
