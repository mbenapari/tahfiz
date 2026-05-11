import { Router } from 'express';
import { notificationController } from '../controller/notificationController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All notification routes are protected by authentication
router.use(authenticate);

// Get all notifications for the authenticated user
router.get('/', notificationController.getUserNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Mark a single notification as read
router.put('/:id/read', notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete a notification (soft delete)
router.delete('/:id', notificationController.deleteNotification);

export default router;
