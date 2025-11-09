import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { cn } from '../../utils/cn';

interface MainLayoutProps {
  children?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Determine if we should show sidebar based on route
  const showSidebar = !location.pathname.includes('/consultation/') && 
                     !location.pathname.includes('/video');

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Header 
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        showMenuButton={showSidebar}
      />
      
      <div className="flex">
        {showSidebar && (
          <Sidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        
        <main 
          className={cn(
            "flex-1 transition-all duration-300 ease-in-out",
            showSidebar && !sidebarOpen ? "lg:ml-64" : "",
            showSidebar && sidebarOpen ? "ml-64" : ""
          )}
        >
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};