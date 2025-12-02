import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home,
  MessageSquare, 
  Scale, 
  ShoppingBag, 
  Book,
  LayoutDashboard,
  Briefcase,
  FileText
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const GlobalSidebar: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  
  // Don't show public sidebar for authenticated users on dashboard/private routes
  const isDashboardRoute = location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/consultations') ||
    location.pathname.startsWith('/appointments') ||
    location.pathname.startsWith('/messages') ||
    location.pathname.startsWith('/clients') ||
    location.pathname.startsWith('/my-services') ||
    location.pathname.startsWith('/billing') ||
    location.pathname.startsWith('/analytics') ||
    location.pathname.startsWith('/performance') ||
    location.pathname.startsWith('/lawyer/') ||
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/help');
  
  // If user is authenticated and on a dashboard route, don't show public sidebar
  if (isAuthenticated && isDashboardRoute) {
    return null;
  }
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  // Public navigation items (for non-authenticated users or public pages)
  const navigationItems = [
    { path: '/', icon: Home, label: 'home' },
    { path: '/ai', icon: MessageSquare, label: 'Smart AI Kenyan Lawyer' },
    { path: '/lawyers', icon: Scale, label: 'Find a Lawyer' },
    { path: '/services', icon: Briefcase, label: 'Book Legal Service Package' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Get Legal Document' },
    { path: '/documents', icon: FileText, label: 'Case Analysis & Advice' },
    { path: '/resources', icon: Book, label: 'Explore Legal Guides' },
  ];
  
  const dashboardItem = { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' };
  
  return (
    <aside className="hidden lg:block w-64 fixed left-0 top-14 h-[calc(100vh-3.5rem)] bg-[#e7f3ff] border-r border-blue-200 overflow-y-auto">
      <div className="p-3">
        <nav className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link 
                key={item.path}
                to={item.path} 
                className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  active 
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          {isAuthenticated && (
            <>
              <div className="border-t border-blue-200 my-3"></div>
              <Link 
                to={dashboardItem.path}
                className={`flex items-center space-x-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                  isActive(dashboardItem.path)
                    ? 'bg-blue-100 text-blue-700 font-medium' 
                    : 'text-slate-700 hover:bg-blue-50'
                }`}
              >
                <dashboardItem.icon className="h-5 w-5" />
                <span>{dashboardItem.label}</span>
              </Link>
            </>
          )}
        </nav>
      </div>
    </aside>
  );
};
