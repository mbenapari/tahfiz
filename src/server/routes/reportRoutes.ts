import { Router } from 'express';
import * as reportController from '../controller/reportController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/student/:id', authenticate, reportController.getStudentReport);
router.get('/student/:id/download', authenticate, reportController.downloadStudentReportCSV);
router.get('/school-performance', authenticate, reportController.getSchoolPerformanceReport);
router.get('/students-performance', authenticate, reportController.getStudentsPerformanceList);
router.get('/overall-performance/download', authenticate, reportController.downloadOverallPerformanceCSV);
router.get('/overall-attendance/download', authenticate, reportController.downloadOverallAttendanceCSV);

export default router;
