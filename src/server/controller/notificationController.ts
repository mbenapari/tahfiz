import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import logger from '../utils/logger';

/**
 * Controller for managing user notifications
 */
export const notificationController = {
  /**
   * Get all notifications for the authenticated user
   */
  getUserNotifications: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const tenantId = (req as any).user.tenantId;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;

      const result = await notificationService.getUserNotifications(userId, tenantId, { page, limit, isRead });
      res.json(result);
    } catch (error: any) {
      logger.error('notificationController.getUserNotifications: Error', { error: error.message });
      res.status(500).json({ error: error.message || 'Error fetching notifications' });
    }
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const tenantId = (req as any).user.tenantId;

      const count = await notificationService.getUnreadCount(userId, tenantId);
      res.json({ unreadCount: count });
    } catch (error: any) {
      logger.error('notificationController.getUnreadCount: Error', { error: error.message });
      res.status(500).json({ error: error.message || 'Error fetching unread count' });
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const tenantId = (req as any).user.tenantId;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      const notification = await notificationService.markAsRead(id, userId, tenantId);
      res.json(notification);
    } catch (error: any) {
      logger.error('notificationController.markAsRead: Error', { error: error.message });
      const statusCode = error.message === 'Notification not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message || 'Error marking notification as read' });
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const tenantId = (req as any).user.tenantId;

      await notificationService.markAllAsRead(userId, tenantId);
      res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
      logger.error('notificationController.markAllAsRead: Error', { error: error.message });
      res.status(500).json({ error: error.message || 'Error marking all notifications as read' });
    }
  },

  /**
   * Delete a notification (soft delete)
   */
  deleteNotification: async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const tenantId = (req as any).user.tenantId;
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      await notificationService.deleteNotification(id, userId, tenantId);
      res.status(204).send();
    } catch (error: any) {
      logger.error('notificationController.deleteNotification: Error', { error: error.message });
      const statusCode = error.message === 'Notification not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message || 'Error deleting notification' });
    }
  }
};
