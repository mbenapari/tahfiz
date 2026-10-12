import { Router } from 'express';
import * as sessionController from '../controller/sessionController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticate, sessionController.saveDailySession);
router.get('/instructor/has-activity', authenticate, sessionController.getInstructorHasActivity);
router.get('/student/:studentId', authenticate, sessionController.getStudentSessions);
router.get('/history/:studentId', authenticate, sessionController.getSessionHistory);

export default router;
