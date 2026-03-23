import { Request, Response } from 'express';
import * as surahService from '../services/surahService';
import * as surahProgressService from '../services/surahProgressService';
import logger from '../utils/logger';

/**
 * Get all surahs
 */
export const getAllSurahs = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  try {
    const surahs = await surahService.getAllSurahs();
    res.json({ surahs });
  } catch (error: any) {
    logger.error('surahController.getAllSurahs: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to fetch surahs' });
  }
};

/**
 * Get progress for a specific student and surah
 */
export const getStudentSurahProgress = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { studentId, surahNumber } = req.params;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const progress = await surahProgressService.getSpecificSurahProgress(
      Number(studentId),
      Number(surahNumber),
      tenantId
    );
    res.json({ progress });
  } catch (error: any) {
    logger.error('surahController.getStudentSurahProgress: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to fetch surah progress' });
  }
};

/**
 * Get all surah progress for a student
 */
export const getAllStudentProgress = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { studentId } = req.params;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const progress = await surahProgressService.getStudentSurahProgress(
      Number(studentId),
      tenantId
    );
    res.json({ progress });
  } catch (error: any) {
    logger.error('surahController.getAllStudentProgress: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to fetch student progress' });
  }
};
