import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GlobalLayout } from '../components/layout';
import { useAuthStore } from '../store/authStore';

const DocumentServicesPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  // Redirect logic: if not authenticated, go to login, then to documents page
  useEffect(() => {
    if (!isAuthenticated) {
      // Redirect to login with return path to documents
      navigate('/login', {
        state: {
          returnTo: '/documents',
          message: 'Please log in to access Case Analysis & Review'
        }
      });
    } else {
      // User is authenticated, redirect to documents page
      navigate('/documents');
    }
  }, [isAuthenticated, navigate]);

  // Show loading state while redirecting
  return (
    <GlobalLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Redirecting...</p>
        </div>
      </div>
    </GlobalLayout>
  );
};

export default DocumentServicesPage;
