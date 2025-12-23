import React from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { Navbar } from '../components/Navbar';

export const DashboardLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-background-dark font-display text-white overflow-hidden">
      
      {/* Sidebar - Fixed Position */}
      <Sidebar />
      
      {/* Main Content Wrapper */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen relative">
        
        {/* Navbar - Sticky Top */}
        <Navbar />
        
        {/* Page Content - Scrollable Area */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-8">
          <Outlet />
        </main>
        
      </div>
    </div>
  );
};
