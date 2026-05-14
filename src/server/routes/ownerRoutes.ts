import { Router } from 'express';
import * as ownerController from '../controller/systemOwnerController';
import { authenticate } from '../middleware/authMiddleware';
import { rateLimit } from '../middleware/rateLimitMiddleware';
import ownerManageRoutes from './ownerManageRoutes';

const router = Router();

const authLimiter = rateLimit(60 * 1000, 10); // 10 requests per minute

// Public login route for system owners
router.post('/login', authLimiter, ownerController.login);

// Logout should be protected to ensure a token is present
router.post('/logout', authenticate, ownerController.logout);

router.get('/me', authenticate, ownerController.getMe);

// Management subroutes
router.use('/manage', ownerManageRoutes);

export default router;
