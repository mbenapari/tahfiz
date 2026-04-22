import { Router } from 'express';
import { analyticsController } from '../controller/analyticsController';
import { authenticate } from '../middleware/authMiddleware';
import { cacheMiddleware } from '../middleware/cacheMiddleware';

const router = Router();

// All metrics routes are protected by auth
router.use(authenticate);

router.get('/active-students', cacheMiddleware(300), analyticsController.getActiveStudents);
router.get('/juz-completed', cacheMiddleware(300), analyticsController.getJuzCompleted);
router.get('/sessions', cacheMiddleware(300), analyticsController.getSessionsCount);
router.get('/juz-revised', cacheMiddleware(300), analyticsController.getJuzRevised);
router.get('/attendance', cacheMiddleware(600), analyticsController.getAttendanceMetrics);
router.get('/attendance/breakdown', cacheMiddleware(600), analyticsController.getAttendanceBreakdown);
router.get('/memorization/progress', cacheMiddleware(600), analyticsController.getMemorizationProgress);

export default router;
