import React from 'react';
import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { WakiliLogo } from '../ui/WakiliLogo';

interface GlobalTopBarProps {
  onMenuClick?: () => void;
}

export const GlobalTopBar: React.FC<GlobalTopBarProps> = ({ onMenuClick }) => {
  const { isAuthenticated, user, logout } = useAuthStore();
  
  const handleLogout = async () => {
    await logout();
    window.location.href = '/';
  };
  
  return (
    <header className="sticky top-0 z-50 bg-[#e7f3ff] border-b border-blue-200 shadow-sm">
      <div className="px-4">
        <div className="flex justify-between items-center h-14">
          <div className="flex items-center space-x-2">
            <button 
              onClick={onMenuClick}
              className="lg:hidden p-2 hover:bg-blue-100 rounded transition-colors"
            >
              <Menu className="h-5 w-5 text-slate-700" />
            </button>
            <Link to="/" className="flex items-center">
              <WakiliLogo size="sm" variant="full" />
            </Link>
          </div>
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <span className="text-xs text-slate-700 hidden sm:inline">Hi, {user?.firstName}</span>
                <Link 
                  to="/dashboard" 
                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 text-xs border border-slate-300 text-slate-700 rounded hover:bg-slate-200 transition-colors"
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
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
