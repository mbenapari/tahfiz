import React from 'react';
import { NavLink } from 'react-router';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  BarChart3, 
  GraduationCap, 
  Settings,
  LogOut,
  Loader2
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Users, label: 'Students', path: '/students' },
    { icon: GraduationCap, label: 'Instructors', path: '/instructors' },
    // { icon: BookOpen, label: 'Classes', path: '/classes' },
    { icon: BarChart3, label: 'Reports', path: '/reports' },
  ];

  return (
    <aside className="w-64 min-h-screen bg-background-dark border-r border-border-green/20 flex flex-col font-display fixed left-0 top-0 bottom-0 z-40">
      
      {/* Header */}
      <div className="p-6 flex items-center gap-3">
        <div className="bg-surface-dark p-2 rounded-xl border border-border-green/30">
          <Logo className="text-primary w-8 h-8" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-white font-bold text-lg leading-tight">
            {user?.school_name || 'Tahfiz'}<br/>Academy
          </h1>
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
          <NavLink
            to="/profile"
            className={({ isActive }) => `
              flex items-center gap-3 px-2 py-3 rounded-xl transition-all duration-200 group cursor-pointer
              ${isActive
                ? 'bg-surface-dark text-primary border border-border-green/30'
                : 'text-text-muted hover:text-white hover:bg-white/5'
              }
            `}
          >
            <div className="w-10 h-10 rounded-full bg-surface-dark border border-border-green/30 flex items-center justify-center overflow-hidden">
               {/* Placeholder Avatar */}
               <img 
                 src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.first_name || 'User'}`} 
                 alt="User Avatar" 
                 className="w-full h-full object-cover"
               />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-sm">
                {user?.first_name} {user?.last_name}
              </span>
              <span className="text-primary text-xs font-medium capitalize">
                {user?.role}
              </span>
            </div>
          </NavLink>
        </div>

        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mt-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 group disabled:opacity-50"
        >
          {isLoggingOut ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
          )}
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
};
