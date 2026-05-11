import { Router } from 'express';
import * as userController from '../controller/userController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out the current user and invalidate the session
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticate, userController.logout);

export default router;
