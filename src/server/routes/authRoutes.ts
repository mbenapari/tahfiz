import { Router } from 'express';
import * as authController from '../controller/authController';
import { rateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

const authLimiter = rateLimit(60 * 1000, 10); // 10 requests per minute

router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);

export default router;
