import React from 'react';
import { Outlet } from 'react-router';
import OwnerSidebar from '../components/OwnerSidebar';
import { Navbar } from '../components/Navbar';

export const OwnerLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-dark text-white font-display">
      <Navbar />
      <div className="flex">
        <OwnerSidebar />
        <div className="flex-1 p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default OwnerLayout;
