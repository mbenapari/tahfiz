import React, { useState } from 'react';
import { Outlet } from 'react-router';
import OwnerSidebar from '../components/OwnerSidebar';
import { Navbar } from '../components/Navbar';

export const OwnerLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background-dark text-white font-display">
      <Navbar onMenuClick={() => setIsSidebarOpen(true)} />
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className="flex">
        <OwnerSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto overflow-hidden">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default OwnerLayout;
