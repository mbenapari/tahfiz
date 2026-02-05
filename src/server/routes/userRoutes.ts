import { Router } from 'express';
import * as userController from '../controller/userController';
import { authenticate } from '../middleware/authMiddleware';
import { rateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

const authLimiter = rateLimit(60 * 1000, 10); // 10 requests per minute

router.post('/register', authLimiter, userController.register);
router.post('/login', authLimiter, userController.login);
router.post('/logout', userController.logout);
router.get('/me', authenticate, userController.getCurrentUser);

export default router;
