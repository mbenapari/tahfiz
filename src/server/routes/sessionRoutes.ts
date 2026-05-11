import { Router } from 'express';
import * as sessionController from '../controller/sessionController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.post('/', authenticate, sessionController.saveDailySession);
router.get('/student/:studentId', authenticate, sessionController.getStudentSessions);

export default router;
