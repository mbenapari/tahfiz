import { Notification } from '../model';
import { NotificationCreationAttributes } from '../model/Notification';
import logger from '../utils/logger';

/**
 * Service for managing user notifications
 */
export const notificationService = {
  /**
   * Create a new notification
   */
  createNotification: async (data: NotificationCreationAttributes) => {
    try {
      const notification = await Notification.create(data);
      return notification;
    } catch (error) {
      logger.error('notificationService.createNotification: Error', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Get paginated notifications for a user
   */
  getUserNotifications: async (userId: number, tenantId: number, options: { page?: number; limit?: number; isRead?: boolean } = {}) => {
    try {
      const { page = 1, limit = 20, isRead } = options;
      const offset = (page - 1) * limit;

      const where: any = { user_id: userId, tenant_id: tenantId };
      if (isRead !== undefined) {
        where.is_read = isRead;
      }

      const { count, rows } = await Notification.findAndCountAll({
        where,
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      return {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
        notifications: rows,
      };
    } catch (error) {
      logger.error('notificationService.getUserNotifications: Error', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (id: number, userId: number, tenantId: number) => {
    try {
      const notification = await Notification.findOne({
        where: { id, user_id: userId, tenant_id: tenantId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.update({ is_read: true });
      return notification;
    } catch (error) {
      logger.error('notificationService.markAsRead: Error', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead: async (userId: number, tenantId: number) => {
    try {
      await Notification.update(
        { is_read: true },
        { where: { user_id: userId, tenant_id: tenantId, is_read: false } }
      );
      return true;
    } catch (error) {
      logger.error('notificationService.markAllAsRead: Error', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Soft delete a notification
   */
  deleteNotification: async (id: number, userId: number, tenantId: number) => {
    try {
      const notification = await Notification.findOne({
        where: { id, user_id: userId, tenant_id: tenantId },
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      await notification.destroy();
      return true;
    } catch (error) {
      logger.error('notificationService.deleteNotification: Error', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Get unread count for a user
   */
  getUnreadCount: async (userId: number, tenantId: number) => {
    try {
      return await Notification.count({
        where: { user_id: userId, tenant_id: tenantId, is_read: false },
      });
    } catch (error) {
      logger.error('notificationService.getUnreadCount: Error', { error: (error as Error).message });
      throw error;
    }
  }
};
