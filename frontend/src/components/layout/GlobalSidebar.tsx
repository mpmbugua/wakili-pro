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
  const { isAuthenticated } = useAuthStore();
  
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };
  
  const navigationItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/ai', icon: MessageSquare, label: 'AI Legal Assistant' },
    { path: '/lawyers', icon: Scale, label: 'Expert Lawyers' },
    { path: '/services', icon: Briefcase, label: 'Legal Services' },
    { path: '/document-services', icon: FileText, label: 'Case Analysis & Review' },
    { path: '/marketplace', icon: ShoppingBag, label: 'Legal Documents' },
    { path: '/resources', icon: Book, label: 'Legal Resources' },
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
