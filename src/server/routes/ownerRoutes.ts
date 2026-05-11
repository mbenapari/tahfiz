import { Router } from 'express';
import * as ownerController from '../controller/systemOwnerController';
import { authenticate } from '../middleware/authMiddleware';
import ownerManageRoutes from './ownerManageRoutes';

const router = Router();

// Public login route for system owners
router.post('/login', ownerController.login);

// Logout should be protected to ensure a token is present
router.post('/logout', authenticate, ownerController.logout);

router.get('/me', authenticate, ownerController.getMe);

// Management subroutes
router.use('/manage', ownerManageRoutes);

export default router;
