import { Router } from 'express';
import * as surahController from '../controller/surahController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Surah metadata
router.get('/', authenticate, surahController.getAllSurahs);

// Student progress in surahs
router.get('/progress/:studentId', authenticate, surahController.getAllStudentProgress);
router.get('/progress/:studentId/:surahNumber', authenticate, surahController.getStudentSurahProgress);

export default router;
