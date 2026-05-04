import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';

export const OwnerSidebar: React.FC = () => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside className="w-64 bg-surface-dark border-r border-border-green/20 min-h-screen p-6 hidden md:block">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-primary/20 p-2 rounded-lg backdrop-blur-sm border border-primary/30">
          <Logo className="text-primary w-6 h-6" />
        </div>
        <div className="text-white font-bold">Tahfiz Owner</div>
      </div>

      <nav className="flex flex-col gap-2">
        <Link
          to="/owner"
          className={`px-4 py-3 rounded-lg font-medium ${isActive('/owner') ? 'bg-primary/5 border border-primary' : 'text-text-muted hover:text-white'}`}
        >
          Dashboard
        </Link>
        <Link
          to="/owner/manage/schools"
          className={`px-4 py-3 rounded-lg font-medium ${isActive('/owner/manage/schools') ? 'bg-primary/5 border border-primary' : 'text-text-muted hover:text-white'}`}
        >
          Manage Schools
        </Link>
        <Link
          to="/owner/manage/users"
          className={`px-4 py-3 rounded-lg font-medium ${isActive('/owner/manage/users') ? 'bg-primary/5 border border-primary' : 'text-text-muted hover:text-white'}`}
        >
          Manage Users
        </Link>
        <Link
          to="/owner/manage/owners"
          className={`px-4 py-3 rounded-lg font-medium ${isActive('/owner/manage/owners') ? 'bg-primary/5 border border-primary' : 'text-text-muted hover:text-white'}`}
        >
          Manage Owners
        </Link>
      </nav>
    </aside>
  );
};

export default OwnerSidebar;
