import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background-dark font-display text-white overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Responsive Position */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-h-screen relative transition-all duration-300 lg:ml-64">
        
        {/* Navbar - Sticky Top */}
        <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
        
        {/* Page Content - Scrollable Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
};
