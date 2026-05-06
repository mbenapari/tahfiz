import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { X } from 'lucide-react';

interface OwnerSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const OwnerSidebar: React.FC<OwnerSidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);

  return (
    <aside className={`
      w-64 bg-surface-dark border-r border-border-green/20 min-h-screen p-6 fixed md:relative z-50 transition-transform duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
    `}>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-lg backdrop-blur-sm border border-primary/30">
            <Logo className="text-primary w-6 h-6" />
          </div>
          <div className="text-white font-bold">Tahfiz Owner</div>
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="md:hidden p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-lg"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="flex flex-col gap-2">
        <Link
          to="/owner"
          onClick={onClose}
          className={`px-4 py-3 rounded-lg font-medium ${isActive('/owner') ? 'bg-primary/5 border border-primary' : 'text-text-muted hover:text-white'}`}
        >
          Dashboard
        </Link>
        <Link
          to="/owner/manage/schools"
          onClick={onClose}
          className={`px-4 py-3 rounded-lg font-medium ${isActive('/owner/manage/schools') ? 'bg-primary/5 border border-primary' : 'text-text-muted hover:text-white'}`}
        >
          Manage Schools
        </Link>
        <Link
          to="/owner/manage/users"
          onClick={onClose}
          className={`px-4 py-3 rounded-lg font-medium ${isActive('/owner/manage/users') ? 'bg-primary/5 border border-primary' : 'text-text-muted hover:text-white'}`}
        >
          Manage Users
        </Link>
        <Link
          to="/owner/manage/owners"
          onClick={onClose}
          className={`px-4 py-3 rounded-lg font-medium ${isActive('/owner/manage/owners') ? 'bg-primary/5 border border-primary' : 'text-text-muted hover:text-white'}`}
        >
          Manage Owners
        </Link>
      </nav>
    </aside>
  );
};

export default OwnerSidebar;
