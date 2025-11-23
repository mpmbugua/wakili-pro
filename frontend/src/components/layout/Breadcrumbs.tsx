import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter(x => x);

  // Route name mapping
  const routeNames: Record<string, string> = {
    dashboard: 'Dashboard',
    consultations: 'Consultations',
    appointments: 'Appointments',
    messages: 'Messages',
    documents: 'Documents',
    clients: 'Clients',
    billing: 'Billing',
    analytics: 'Analytics',
    settings: 'Settings',
    admin: 'Admin',
    users: 'Users',
    lawyers: 'Lawyers',
    marketplace: 'Marketplace',
    ai: 'AI Assistant',
    services: 'Services',
    resources: 'Resources',
    profile: 'Profile',
  };

  if (pathnames.length === 0 || pathnames[0] === '') {
    return null;
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <Link
            to="/dashboard"
            className="text-slate-500 hover:text-slate-700 transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
        </li>
        
        {pathnames.map((pathname, index) => {
          const routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = routeNames[pathname] || pathname.charAt(0).toUpperCase() + pathname.slice(1);

          return (
            <li key={pathname} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-slate-400 mx-1" />
              {isLast ? (
                <span className="font-medium text-slate-900">{displayName}</span>
              ) : (
                <Link
                  to={routeTo}
                  className="text-slate-500 hover:text-slate-700 transition-colors"
                >
                  {displayName}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
