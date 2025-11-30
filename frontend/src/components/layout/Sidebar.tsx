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
  X,
  Briefcase,
  Book,
  Award,
  TrendingUp
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';

interface SidebarProps {
  isOpen: boolean;
  collapsed: boolean;
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
  { name: 'AI Assistant', href: '/lawyer/ai', icon: Book },
];

const lawyerNavigation: NavItem[] = [
  { name: 'My Clients', href: '/clients', icon: Users },
  { name: 'Services', href: '/my-services', icon: Briefcase },
  { name: 'Billing', href: '/billing', icon: CreditCard },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Performance', href: '/performance', icon: Award },
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

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, collapsed, onClose }) => {
  const location = useLocation();
  const { user } = useAuthStore();

  const isAdmin = user?.role === 'ADMIN';
  const isLawyer = user?.role === 'LAWYER';

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = location.pathname === item.href || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
    
    return (
      <Link
        to={item.href}
        className={cn(
          "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          collapsed ? "justify-center" : "space-x-3",
          isActive
            ? "bg-primary-50 text-primary-700 border-l-4 border-primary-600"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 border-l-4 border-transparent"
        )}
        onClick={() => onClose()}
        title={collapsed ? item.name : undefined}
      >
        <item.icon className={cn(
          "h-5 w-5 flex-shrink-0 transition-colors",
          isActive ? "text-primary-600" : "text-slate-500 group-hover:text-slate-700"
        )} />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  const NavSection: React.FC<{ title: string; icon: React.ReactNode; items: NavItem[] }> = ({ title, icon, items }) => (
    <div className="space-y-1">
      {!collapsed && (
        <div className="flex items-center space-x-2 px-3 py-2 mb-1">
          {icon}
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {title}
          </h3>
        </div>
      )}
      {items.map((item) => (
        <NavLink key={item.name} item={item} />
      ))}
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden" 
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 transition-all duration-300 ease-in-out overflow-hidden",
        collapsed ? "w-20" : "w-64",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex h-full flex-col">
          {/* Close button for mobile */}
          {!collapsed && (
            <div className="flex items-center justify-between px-4 py-3 lg:hidden border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Navigation</h2>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-6">
            {/* Main Navigation */}
            <NavSection 
              title="Main" 
              icon={<Home className="h-4 w-4 text-slate-400" />}
              items={navigation}
            />

            {/* Lawyer Section */}
            {isLawyer && (
              <NavSection 
                title="Lawyer Tools" 
                icon={<Scale className="h-4 w-4 text-slate-400" />}
                items={lawyerNavigation}
              />
            )}

            {/* Admin Section */}
            {isAdmin && (
              <NavSection 
                title="Administration" 
                icon={<Shield className="h-4 w-4 text-slate-400" />}
                items={adminNavigation}
              />
            )}
          </nav>

          {/* Bottom Navigation */}
          <div className="border-t border-slate-200 p-3 space-y-1">
            {bottomNavigation.map((item) => (
              <NavLink key={item.name} item={item} />
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};
