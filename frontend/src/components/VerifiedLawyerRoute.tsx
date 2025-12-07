import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import axiosInstance from '../lib/axios';
import { Clock, Loader } from 'lucide-react';

interface VerifiedLawyerRouteProps {
  children: React.ReactNode;
}

export const VerifiedLawyerRoute: React.FC<VerifiedLawyerRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const user = useAuthStore(state => state.user);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      if (!isAuthenticated || !user || user.role !== 'LAWYER') {
        setLoading(false);
        return;
      }

      try {
        const response = await axiosInstance.get('/users/profile');
        const profileData = response.data?.data;
        const lawyerProfile = profileData?.lawyerProfile;

        setHasProfile(!!lawyerProfile);
        
        // Check verification - must be explicitly verified
        const verified = lawyerProfile?.isVerified === true;
        setIsVerified(verified);
      } catch (error) {
        console.error('[VerifiedLawyerRoute] Verification check failed:', error);
        // On error, deny access (fail closed for security)
        setIsVerified(false);
        setHasProfile(false);
      } finally {
        setLoading(false);
      }
    };

    checkVerification();
  }, [isAuthenticated, user]);

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Not a lawyer - redirect to client dashboard
  if (!user || user.role !== 'LAWYER') {
    return <Navigate to="/dashboard" replace />;
  }

  // Still checking verification status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto text-blue-600 mb-2" />
          <p className="text-sm text-slate-600">Checking verification status...</p>
        </div>
      </div>
    );
  }

  // No profile - redirect to onboarding
  if (!hasProfile) {
    return <Navigate to="/lawyer/onboarding" replace />;
  }

  // Profile exists but not verified - show blocked message
  if (!isVerified) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16">
        <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Verification Required</h2>
          <p className="text-gray-700 mb-4">
            Your profile is currently under review. You'll be able to access this feature once your account is verified by our admin team.
          </p>
          <p className="text-sm text-gray-600">
            Verification typically takes 24-48 hours. You'll receive an email notification once approved.
          </p>
        </div>
      </div>
    );
  }

  // Verified lawyer - allow access
  return <>{children}</>;
};
