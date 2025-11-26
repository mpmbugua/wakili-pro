import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { WakiliLogo } from '../ui/WakiliLogo';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <WakiliLogo size="sm" variant="full" />
            </Link>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <span className="text-sm text-slate-700 hidden sm:inline">
                    Hi, {user?.firstName}
                  </span>
                  <Link 
                    to="/dashboard" 
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="text-sm text-slate-700 hover:text-blue-600 transition-colors"
                  >
                    Log In
                  </Link>
                  <Link 
                    to="/register" 
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>

      {/* Simple Footer */}
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <WakiliLogo size="sm" variant="full" />
              <p className="text-xs text-slate-400 mt-2">
                &copy; 2025 Wakili Pro. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              <Link to="/" className="text-sm text-slate-400 hover:text-slate-200">
                Home
              </Link>
              <Link to="/ai" className="text-sm text-slate-400 hover:text-slate-200">
                AI Assistant
              </Link>
              <Link to="/lawyers" className="text-sm text-slate-400 hover:text-slate-200">
                Find Lawyers
              </Link>
              <Link to="/marketplace" className="text-sm text-slate-400 hover:text-slate-200">
                Documents
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
