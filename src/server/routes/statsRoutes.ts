import { Router } from 'express';
import * as statsController from '../controller/statsController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// All stats routes are protected
router.use(authenticate);

router.get('/active-students', statsController.getActiveStudents);
router.get('/total-hifz', statsController.getTotalHifz);
router.get('/today-sessions', statsController.getTodaySessions);
router.get('/pending-reviews', statsController.getPendingReviews);

export default router;
