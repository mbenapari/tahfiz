import { Router } from 'express';
import * as reportController from '../controller/reportController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

router.get('/student/:id', authenticate, reportController.getStudentReport);
router.get('/student/:id/download', authenticate, reportController.downloadStudentReportCSV);

export default router;
