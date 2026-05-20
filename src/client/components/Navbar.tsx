import React from 'react';
import { useNavigate } from 'react-router';
import { 
  Search, 
  Bell, 
  MessageSquare, 
  Plus,
  Menu
} from 'lucide-react';

interface NavbarProps {
  onMenuClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();

  return (
    <header className="h-20 bg-background-dark border-b border-border-green/20 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 font-display">
      
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Button */}
        <button 
          onClick={onMenuClick}
          className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl hover:bg-surface-dark transition-colors group"
        >
          <Menu className="text-white group-hover:text-primary transition-colors" size={24} />
        </button>

        {/* Search Bar (Placeholder) */}
        <div className="hidden md:block flex-1 max-w-xl">
          {/* Search input would go here */}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        
        {/* Notifications */}
        <button className="relative w-11 h-11 flex items-center justify-center rounded-xl hover:bg-surface-dark transition-colors group">
          <Bell className="text-white group-hover:text-primary transition-colors" size={22} />
          <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full ring-2 ring-background-dark"></span>
        </button>

        {/* Messages */}
        <button className="w-11 h-11 flex items-center justify-center rounded-xl hover:bg-surface-dark transition-colors group">
          <MessageSquare className="text-white group-hover:text-primary transition-colors" size={22} />
        </button>

      </div>
    </header>
  );
};
