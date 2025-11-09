import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  MessageSquare, 
  FileText, 
  Users, 
  BarChart3, 
  Shield, 
  Scale,
  Video,
  CreditCard,
  Settings,
  HelpCircle,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Consultations', href: '/consultations', icon: Video },
  { name: 'Appointments', href: '/appointments', icon: Calendar },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Clients', href: '/clients', icon: Users, roles: ['LAWYER'] },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Analytics', href: '/analytics', icon: BarChart3, roles: ['LAWYER'] },
];

const adminNavigation: NavItem[] = [
  { name: 'Admin Dashboard', href: '/admin', icon: Shield },
  { name: 'User Management', href: '/admin/users', icon: Users },
  { name: 'Lawyer Verification', href: '/admin/lawyers', icon: Scale },
  { name: 'System Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'System Settings', href: '/admin/settings', icon: Settings },
];

const bottomNavigation: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';
  const isLawyer = user?.role === 'LAWYER';

  const filteredNavigation = navigation.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = location.pathname === item.href || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
    
    return (
      <Link
        to={item.href}
        className={cn(
          "group flex items-center space-x-3 rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25"
            : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
        )}
        onClick={() => onClose()}
      >
        <item.icon className={cn(
          "h-5 w-5 flex-shrink-0 transition-colors",
          isActive ? "text-white" : "text-gray-500 group-hover:text-gray-700"
        )} />
        <span>{item.name}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-25 lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between px-4 py-3 lg:hidden">
            <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {/* Main Navigation */}
            <div className="space-y-1">
              {filteredNavigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>

            {/* Admin Section */}
            {isAdmin && (
              <>
                <div className="pt-6">
                  <div className="flex items-center space-x-2 px-3 py-2">
                    <Shield className="h-4 w-4 text-gray-400" />
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Administration
                    </h3>
                  </div>
                  <div className="space-y-1">
                    {adminNavigation.map((item) => (
                      <NavLink key={item.name} item={item} />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Lawyer Badge */}
            {isLawyer && (
              <div className="pt-6">
                <div className="mx-3 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 p-3">
                  <div className="flex items-center space-x-2">
                    <Scale className="h-4 w-4 text-amber-600" />
                    <span className="text-xs font-medium text-amber-800">
                      Verified Lawyer
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-amber-700">
                    You have full access to legal practice features.
                  </p>
                </div>
              </div>
            )}
          </nav>

          {/* Bottom Navigation */}
          <div className="border-t border-gray-200 p-3">
            <div className="space-y-1">
              {bottomNavigation.map((item) => (
                <NavLink key={item.name} item={item} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
