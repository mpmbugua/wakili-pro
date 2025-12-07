import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, Search, User, LogOut, Settings, Lock } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useEventTracking } from '../../hooks/useAnalytics';
import { WakiliLogo } from '../ui/WakiliLogo';
import { Button } from '../ui/Button';
import axiosInstance from '../../lib/axios';

interface HeaderProps {
  onMenuClick: () => void;
  showMenuButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, showMenuButton = true }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { trackSearch } = useEventTracking();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isLawyer = user?.role === 'LAWYER';

  // Check lawyer verification status
  useEffect(() => {
    const checkVerification = async () => {
      if (!isLawyer) {
        setCheckingVerification(false);
        setIsVerified(true); // Non-lawyers don't need verification
        return;
      }

      try {
        const response = await axiosInstance.get('/users/profile');
        const lawyerProfile = response.data?.data?.lawyerProfile;
        setIsVerified(lawyerProfile?.isVerified === true);
      } catch (error) {
        console.error('[Header] Verification check failed:', error);
        setIsVerified(false);
      } finally {
        setCheckingVerification(false);
      }
    };

    checkVerification();
  }, [isLawyer]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      trackSearch(searchQuery, { page: 'global_header' });
      // TODO: Implement actual search navigation
      console.log('Search:', searchQuery);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      await logout();
      console.log('Logout successful, redirecting...');
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      navigate('/', { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200/50 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {showMenuButton && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuClick}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </Button>
          )}
          
          <Link to="/dashboard" className="flex items-center space-x-3">
            <WakiliLogo size="sm" />
            <span className="hidden font-semibold text-gray-900 sm:inline-block">
              Wakili Pro
            </span>
          </Link>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 flex justify-center px-6">
          <form onSubmit={handleSearch} className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search lawyers, documents, legal help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => {
                if (searchQuery.trim()) {
                  trackSearch(searchQuery, { page: 'global_header', trigger: 'blur' });
                }
              }}
              className="w-full rounded-xl border-0 bg-gray-100 py-2 pl-10 pr-4 text-sm focus:bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all duration-200"
            />
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Notifications */}
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs"></span>
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-3 pl-2">
            <div className="hidden text-right lg:block">
              <div className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500 capitalize">
                {user?.role?.toLowerCase()}
              </div>
            </div>
            
            <div className="relative group" ref={profileMenuRef}>
              <Button
                variant="ghost" 
                size="sm"
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center space-x-2 rounded-full"
              >
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-sky-400 to-blue-500 flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
              </Button>

              {/* Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 z-50">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-lg py-1">
                    {/* My Profile - Locked for unverified lawyers */}
                    {isLawyer && !isVerified ? (
                      <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed opacity-60">
                        <User className="h-4 w-4" />
                        <span>My Profile</span>
                        <Lock className="h-3 w-3 ml-auto" />
                      </div>
                    ) : (
                      <Link
                        to="/profile"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>My Profile</span>
                      </Link>
                    )}

                    {/* Settings - Locked for unverified lawyers */}
                    {isLawyer && !isVerified ? (
                      <div className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-400 cursor-not-allowed opacity-60">
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                        <Lock className="h-3 w-3 ml-auto" />
                      </div>
                    ) : (
                      <Link
                        to="/settings"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings className="h-4 w-4" />
                        <span>Settings</span>
                      </Link>
                    )}

                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleLogout();
                      }}
                      className="flex w-full items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
