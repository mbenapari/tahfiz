import React from 'react';
import { NavLink } from 'react-router';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3, 
  Calendar, 
  Settings 
} from 'lucide-react';
import { Logo } from './Logo';

export const Sidebar: React.FC = () => {
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Students', path: '/students' },
    { icon: BookOpen, label: 'Classes', path: '/classes' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
    { icon: Calendar, label: 'Schedule', path: '/schedule' },
  ];

  return (
    <aside className="w-64 min-h-screen bg-background-dark border-r border-border-green/20 flex flex-col font-display fixed left-0 top-0 bottom-0 z-40">
      
      {/* Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-surface-dark p-2 rounded-xl border border-border-green/30">
          <Logo className="text-primary w-8 h-8" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-white font-bold text-lg leading-tight">Al-Furqan<br/>Academy</h1>
          <span className="text-text-muted text-xs font-medium mt-0.5">Admin Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive 
                ? 'bg-surface-dark text-primary font-bold shadow-sm border border-border-green/30' 
                : 'text-text-muted hover:text-white hover:bg-white/5'
              }
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={20} 
                  className={isActive ? 'text-primary' : 'text-text-muted group-hover:text-white transition-colors'} 
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-4 mt-auto">
        <NavLink
          to="/settings"
          className={({ isActive }) => `
            flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-4 group
            ${isActive 
              ? 'bg-surface-dark text-primary font-bold shadow-sm border border-border-green/30' 
              : 'text-text-muted hover:text-white hover:bg-white/5'
            }
          `}
        >
          <Settings size={20} className="group-hover:text-white transition-colors" />
          <span>Settings</span>
        </NavLink>

        <div className="pt-4 border-t border-border-green/20">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-surface-dark border border-border-green/30 flex items-center justify-center overflow-hidden">
               {/* Placeholder Avatar */}
               <img 
                 src="https://api.dicebear.com/7.x/avataaars/svg?seed=SheikhAbdullah" 
                 alt="User Avatar" 
                 className="w-full h-full object-cover"
               />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm">Sheikh Abdullah</span>
              <span className="text-primary text-xs font-medium">Instructor</span>
            </div>
          </div>
        </div>
      </div>

    </aside>
  );
};
