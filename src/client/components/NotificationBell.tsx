import React, { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCheck, Loader2, X } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';

const formatTimeAgo = (iso: string) => {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
};

export const NotificationBell: React.FC = () => {
  const {
    unreadCount,
    notifications,
    isLoading,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    remove,
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) loadNotifications();
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggle}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative w-11 h-11 flex items-center justify-center rounded-xl hover:bg-surface-dark transition-colors group"
      >
        <Bell className="text-white group-hover:text-primary transition-colors" size={22} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary text-background-dark text-[10px] font-bold rounded-full ring-2 ring-background-dark">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-background-dark border border-border-green/20 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-green/20">
            <h3 className="text-white text-sm font-bold">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <CheckCheck size={14} />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="text-primary animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-text-muted">You're all caught up.</p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`group flex gap-3 px-4 py-3 border-b border-border-green/10 last:border-b-0 ${
                    notification.is_read ? '' : 'bg-primary/5'
                  }`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                      notification.is_read ? 'bg-transparent' : 'bg-primary'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{notification.title}</p>
                    <p className="text-xs text-text-muted mt-0.5 break-words">{notification.message}</p>
                    <p className="text-[10px] text-text-muted/70 mt-1">{formatTimeAgo(notification.created_at)}</p>
                  </div>
                  <div className="flex flex-col gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        aria-label="Mark as read"
                        className="p-1 rounded text-text-muted hover:text-primary"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => remove(notification.id)}
                      aria-label="Delete notification"
                      className="p-1 rounded text-text-muted hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
