import { Router } from 'express';
import * as schoolController from '../controller/schoolController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';

const router = Router();

// Protect this route: Only authenticated users (likely admins) can create schools
// For now, we'll just use authenticate. You can add checkPermission('school:create') later.
router.post('/create', authenticate, schoolController.createSchool);

router.get('/me', authenticate, schoolController.getSchool);
router.put('/update', authenticate, schoolController.updateSchool);

export default router;
