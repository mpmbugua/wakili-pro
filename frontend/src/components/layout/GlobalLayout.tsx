import React, { useState } from 'react';
import { GlobalTopBar } from './GlobalTopBar';
import { GlobalSidebar } from './GlobalSidebar';

interface GlobalLayoutProps {
  children: React.ReactNode;
}

export const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  
  return (
    <div className="min-h-screen bg-[#e7f3ff]">
      <GlobalTopBar onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
      
      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <aside className="fixed left-0 top-14 h-[calc(100vh-3.5rem)] w-64 bg-[#e7f3ff] border-r border-blue-200 overflow-y-auto z-50 lg:hidden">
            <div className="p-3">
              <nav className="space-y-1">
                {/* Mobile navigation will be handled by GlobalSidebar component */}
              </nav>
            </div>
          </aside>
        </>
      )}
      
      <GlobalSidebar />
      
      {/* Main Content Area */}
      <main className="lg:ml-64">
        {children}
      </main>
    </div>
  );
};
