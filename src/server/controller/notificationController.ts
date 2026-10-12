import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';
import logger from '../utils/logger';
import { getTenantId } from '../utils/schoolContext';

/**
 * Controller for managing user notifications
 */
export const notificationController = {
  /**
   * Get all notifications for the authenticated user
   */
  getUserNotifications: async (req: Request, res: Response) => {
    const logId = req.correlationId || 'unknown';
    try {
      const userId = (req as any).user.userId;
      const tenantId = getTenantId(req);
      logger.info(`notificationController: getUserNotifications - Fetching notifications for userId: ${userId}, tenantId: ${tenantId}`, {
        logId,
        tenantId,
        activeSchoolContext: req.activeSchoolId,
        userId
      });
      const rawPage = parseInt(req.query.page as string, 10);
      const rawLimit = parseInt(req.query.limit as string, 10);
      const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
      const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(rawLimit, 100) : 20;
      const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;

      const result = await notificationService.getUserNotifications(userId, tenantId, { page, limit, isRead });
      res.json(result);
    } catch (error: any) {
      if (error.name === 'SchoolContextError') throw error;
      logger.error(`notificationController: getUserNotifications - Error: ${error.message}`, { logId });
      res.status(500).json({ error: error.message || 'Error fetching notifications' });
    }
  },

  /**
   * Get unread notifications count
   */
  getUnreadCount: async (req: Request, res: Response) => {
    const logId = req.correlationId || 'unknown';
    try {
      const userId = (req as any).user.userId;
      const tenantId = getTenantId(req);
      logger.info(`notificationController: getUnreadCount - Fetching count for userId: ${userId}, tenantId: ${tenantId}`, {
        logId,
        tenantId,
        activeSchoolContext: req.activeSchoolId,
        userId
      });

      const count = await notificationService.getUnreadCount(userId, tenantId);
      res.json({ unreadCount: count });
    } catch (error: any) {
      if (error.name === 'SchoolContextError') throw error;
      logger.error(`notificationController: getUnreadCount - Error: ${error.message}`, { logId });
      res.status(500).json({ error: error.message || 'Error fetching unread count' });
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (req: Request, res: Response) => {
    const logId = req.correlationId || 'unknown';
    try {
      const userId = (req as any).user.userId;
      const tenantId = getTenantId(req);
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      logger.info(`notificationController: markAsRead - Marking notification: ${id} for userId: ${userId}, tenantId: ${tenantId}`, {
        logId,
        tenantId,
        activeSchoolContext: req.activeSchoolId,
        userId
      });

      const notification = await notificationService.markAsRead(id, userId, tenantId);
      res.json(notification);
    } catch (error: any) {
      if (error.name === 'SchoolContextError') throw error;
      logger.error(`notificationController: markAsRead - Error: ${error.message}`, { logId });
      const statusCode = error.message === 'Notification not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message || 'Error marking notification as read' });
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (req: Request, res: Response) => {
    const logId = req.correlationId || 'unknown';
    try {
      const userId = (req as any).user.userId;
      const tenantId = getTenantId(req);

      logger.info(`notificationController: markAllAsRead - Marking all for userId: ${userId}, tenantId: ${tenantId}`, {
        logId,
        tenantId,
        activeSchoolContext: req.activeSchoolId,
        userId
      });

      await notificationService.markAllAsRead(userId, tenantId);
      res.json({ message: 'All notifications marked as read' });
    } catch (error: any) {
      if (error.name === 'SchoolContextError') throw error;
      logger.error(`notificationController: markAllAsRead - Error: ${error.message}`, { logId });
      res.status(500).json({ error: error.message || 'Error marking all notifications as read' });
    }
  },

  /**
   * Delete a notification (soft delete)
   */
  deleteNotification: async (req: Request, res: Response) => {
    const logId = req.correlationId || 'unknown';
    try {
      const userId = (req as any).user.userId;
      const tenantId = getTenantId(req);
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid notification ID' });
      }

      logger.info(`notificationController: deleteNotification - Deleting notification: ${id} for userId: ${userId}, tenantId: ${tenantId}`, {
        logId,
        tenantId,
        activeSchoolContext: req.activeSchoolId,
        userId
      });

      await notificationService.deleteNotification(id, userId, tenantId);
      res.status(204).send();
    } catch (error: any) {
      if (error.name === 'SchoolContextError') throw error;
      logger.error(`notificationController: deleteNotification - Error: ${error.message}`, { logId });
      const statusCode = error.message === 'Notification not found' ? 404 : 500;
      res.status(statusCode).json({ error: error.message || 'Error deleting notification' });
    }
  }
};
