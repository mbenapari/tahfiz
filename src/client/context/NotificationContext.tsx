import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
}

interface NotificationContextType {
  showNotification: (type: NotificationType, title: string, message: string) => void;
  removeNotification: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const showNotification = useCallback((type: NotificationType, title: string, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { id, type, title, message }]);

    // Auto-dismiss success and info after 5s, keep error
    if (type !== 'error') {
      setTimeout(() => removeNotification(id), 5000);
    }
  }, [removeNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification, removeNotification }}>
      {children}
      
      {/* Notification Portal */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-4 w-full max-w-sm pointer-events-none">
        {notifications.map((n) => (
          <div 
            key={n.id}
            className="pointer-events-auto animate-in slide-in-from-right-full duration-500"
          >
            <div className={`bg-surface-dark border ${
              n.type === 'error' ? 'border-red-400/30 shadow-red-400/10' : 
              n.type === 'success' ? 'border-green-400/30 shadow-green-400/10' : 
              'border-blue-400/30 shadow-blue-400/10'
            } rounded-2xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden`}>
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  n.type === 'error' ? 'bg-red-400/10 text-red-400' : 
                  n.type === 'success' ? 'bg-green-400/10 text-green-400' : 
                  'bg-blue-400/10 text-blue-400'
                }`}>
                  {n.type === 'error' ? <AlertCircle size={24} /> : 
                   n.type === 'success' ? <CheckCircle2 size={24} /> : 
                   <Info size={24} />}
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-base font-bold text-white leading-none">{n.title}</h3>
                  <p className={`mt-2 text-sm font-medium leading-tight ${
                    n.type === 'error' ? 'text-red-400/80' : 
                    n.type === 'success' ? 'text-green-400/80' : 
                    'text-blue-400/80'
                  }`}>
                    {n.message}
                  </p>
                </div>
                <button
                  onClick={() => removeNotification(n.id)}
                  className="p-1.5 -mr-1 text-text-muted hover:text-white hover:bg-white/5 rounded-lg transition-all shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Auto-clear progress bar for non-error types */}
              {n.type !== 'error' && (
                <div className="absolute bottom-0 left-0 h-1 bg-current opacity-30 w-full overflow-hidden">
                  <div className={`h-full animate-progress-shrink origin-left ${
                    n.type === 'success' ? 'bg-green-400' : 'bg-blue-400'
                  }`}></div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
