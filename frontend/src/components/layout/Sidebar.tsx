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
  TrendingUp,
  Stamp,
  PenSquare,
  Lock
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../ui/Button';
import { cn } from '../../utils/cn';
import { useState, useEffect } from 'react';
import axiosInstance from '../../lib/axios';

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
  requiresVerification?: boolean; // Requires lawyer verification
}

// Public user navigation (clients)
const publicNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Consultations', href: '/consultations', icon: Video },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Get Legal Document', href: '/documents', icon: FileText },
  { name: 'Smart AI Kenyan Lawyer', href: '/ai', icon: Book },
];

// Lawyer navigation - main items
const lawyerMainNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home }, // Always accessible
  { name: 'Consultations', href: '/consultations', icon: Video, requiresVerification: true },
  { name: 'Appointments', href: '/appointments', icon: Calendar, requiresVerification: true },
  { name: 'Messages', href: '/messages', icon: MessageSquare, requiresVerification: true },
  { name: 'Document Reviews', href: '/document-reviews', icon: FileText, requiresVerification: true },
  { name: 'Smart AI Kenyan Lawyer', href: '/lawyer/ai', icon: Book, requiresVerification: true },
];

// Lawyer tools navigation
const lawyerToolsNavigation: NavItem[] = [
  { name: 'My Clients', href: '/clients', icon: Users, requiresVerification: true },
  { name: 'Services', href: '/my-services', icon: Briefcase, requiresVerification: true },
  { name: 'Billing', href: '/billing', icon: CreditCard, requiresVerification: true },
  { name: 'Analytics', href: '/analytics', icon: TrendingUp, requiresVerification: true },
  { name: 'Performance', href: '/performance', icon: Award, requiresVerification: true },
  { name: 'Signature & Stamp', href: '/lawyer/signature-setup', icon: Stamp }, // Accessible before verification
  { name: 'Submit Article', href: '/submit-article', icon: PenSquare, requiresVerification: true },
];

// Admin navigation - main items
const adminMainNavigation: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Messages', href: '/messages', icon: MessageSquare },
  { name: 'Smart AI Kenyan Lawyer', href: '/admin/ai', icon: Book },
];

// Admin management navigation
const adminManagementNavigation: NavItem[] = [
  { name: 'Admin Dashboard', href: '/admin', icon: Shield },
  { name: 'User Management', href: '/admin', icon: Users },
  { name: 'Lawyer Verification', href: '/admin/lawyers', icon: Scale },
  { name: 'System Analytics', href: '/admin', icon: BarChart3 },
  { name: 'System Settings', href: '/admin', icon: Settings },
];

// Super Admin additional navigation
const superAdminNavigation: NavItem[] = [
  { name: 'Admin Dashboard', href: '/admin', icon: Shield },
  { name: 'User Management', href: '/super-admin', icon: Users },
  { name: 'Lawyer Verification', href: '/admin/lawyers', icon: Scale },
  { name: 'System Analytics', href: '/super-admin', icon: BarChart3 },
  { name: 'System Settings', href: '/super-admin', icon: Settings },
  { name: 'Audit Logs', href: '/super-admin', icon: FileText },
];

const bottomNavigation: NavItem[] = [
  { name: 'Settings', href: '/settings', icon: Settings, requiresVerification: true },
  { name: 'Help & Support', href: '/help', icon: HelpCircle, requiresVerification: true },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, collapsed, onClose }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [isVerified, setIsVerified] = useState(false);
  const [checkingVerification, setCheckingVerification] = useState(true);

  const isPublic = user?.role === 'PUBLIC';
  const isLawyer = user?.role === 'LAWYER';
  const isAdmin = user?.role === 'ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

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
        console.error('[Sidebar] Verification check failed:', error);
        setIsVerified(false);
      } finally {
        setCheckingVerification(false);
      }
    };

    checkVerification();
  }, [isLawyer]);

  const NavLink: React.FC<{ item: NavItem }> = ({ item }) => {
    const isActive = location.pathname === item.href || 
                    (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
    
    // Check if item is locked (requires verification but user isn't verified)
    const isLocked = isLawyer && item.requiresVerification && !isVerified;
    
    // If locked, render as disabled button instead of link
    if (isLocked) {
      return (
        <div
          className={cn(
            "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 cursor-not-allowed opacity-60",
            collapsed ? "justify-center" : "space-x-3",
            "text-slate-400 bg-slate-50 border-l-4 border-slate-200"
          )}
          title={collapsed ? `${item.name} - Verification Required` : undefined}
        >
          <Lock className="h-5 w-5 flex-shrink-0 text-slate-400" />
          {!collapsed && (
            <div className="flex items-center justify-between flex-1">
              <span>{item.name}</span>
              <Lock className="h-4 w-4 text-slate-400" />
            </div>
          )}
        </div>
      );
    }
    
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
            {/* PUBLIC USER Navigation */}
            {isPublic && (
              <NavSection 
                title="My Account" 
                icon={<Home className="h-4 w-4 text-slate-400" />}
                items={publicNavigation}
              />
            )}

            {/* LAWYER Navigation */}
            {isLawyer && (
              <>
                <NavSection 
                  title="Main" 
                  icon={<Home className="h-4 w-4 text-slate-400" />}
                  items={lawyerMainNavigation}
                />
                <NavSection 
                  title="Lawyer Tools" 
                  icon={<Scale className="h-4 w-4 text-slate-400" />}
                  items={lawyerToolsNavigation}
                />
              </>
            )}

            {/* ADMIN Navigation */}
            {isAdmin && !isSuperAdmin && (
              <>
                <NavSection 
                  title="Main" 
                  icon={<Home className="h-4 w-4 text-slate-400" />}
                  items={adminMainNavigation}
                />
                <NavSection 
                  title="Administration" 
                  icon={<Shield className="h-4 w-4 text-slate-400" />}
                  items={adminManagementNavigation}
                />
              </>
            )}

            {/* SUPER ADMIN Navigation */}
            {isSuperAdmin && (
              <>
                <NavSection 
                  title="Main" 
                  icon={<Home className="h-4 w-4 text-slate-400" />}
                  items={adminMainNavigation}
                />
                <NavSection 
                  title="Super Admin" 
                  icon={<Shield className="h-4 w-4 text-red-400" />}
                  items={superAdminNavigation}
                />
              </>
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
