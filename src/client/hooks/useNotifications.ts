import { useCallback, useEffect, useRef, useState } from 'react';
import { apiFetch } from '../utils/api';

export interface ServerNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const POLL_INTERVAL_MS = 60 * 1000;

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<ServerNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useRef(true);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const response = await apiFetch('/api/notifications/unread-count');
      if (!response.ok) return;
      const data = await response.json();
      if (mounted.current) setUnreadCount(Number(data.unreadCount) || 0);
    } catch {
      // Polling failures are non-fatal; try again on the next tick.
    }
  }, []);

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch('/api/notifications?limit=20');
      if (!response.ok) return;
      const data = await response.json();
      if (mounted.current) setNotifications(data.notifications || []);
    } catch {
      // Keep whatever was loaded last.
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    const target = notifications.find((n) => n.id === id);
    if (!target || target.is_read) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      const response = await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (!response.ok) throw new Error('mark read failed');
    } catch {
      await Promise.all([loadNotifications(), refreshUnreadCount()]);
    }
  }, [notifications, loadNotifications, refreshUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    try {
      const response = await apiFetch('/api/notifications/read-all', { method: 'PUT' });
      if (!response.ok) throw new Error('mark all read failed');
    } catch {
      await Promise.all([loadNotifications(), refreshUnreadCount()]);
    }
  }, [loadNotifications, refreshUnreadCount]);

  const remove = useCallback(async (id: number) => {
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.is_read) setUnreadCount((count) => Math.max(0, count - 1));
    try {
      const response = await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('delete failed');
    } catch {
      await Promise.all([loadNotifications(), refreshUnreadCount()]);
    }
  }, [notifications, loadNotifications, refreshUnreadCount]);

  useEffect(() => {
    mounted.current = true;
    refreshUnreadCount();
    const timer = window.setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
    };
  }, [refreshUnreadCount]);

  return {
    unreadCount,
    notifications,
    isLoading,
    loadNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    remove,
  };
};
