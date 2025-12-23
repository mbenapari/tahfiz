import React from 'react';
import { 
  Search, 
  Bell, 
  MessageSquare, 
  Plus 
} from 'lucide-react';

export const Navbar: React.FC = () => {
  return (
    <header className="h-20 bg-background-dark border-b border-border-green/20 flex items-center justify-between px-8 sticky top-0 z-30 font-display">
      
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Search students, surahs..." 
            className="w-full h-11 bg-surface-dark border border-border-green/30 rounded-xl pl-11 pr-4 text-white placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors" size={18} />
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

        {/* New Session Button */}
        <button className="flex items-center gap-2 bg-primary text-background-dark px-5 py-2.5 rounded-xl font-bold hover:bg-opacity-90 transition-all shadow-lg shadow-primary/20 ml-2">
          <Plus size={20} />
          <span>New Session</span>
        </button>

      </div>
    </header>
  );
};
