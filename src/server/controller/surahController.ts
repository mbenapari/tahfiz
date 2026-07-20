import { Request, Response } from 'express';
import * as surahService from '../services/surahService';
import * as surahProgressService from '../services/surahProgressService';
import logger from '../utils/logger';
import { getTenantId } from '../utils/schoolContext';

/**
 * Get all surahs
 */
export const getAllSurahs = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    logger.info(`surahController: getAllSurahs - Fetching all surahs`, { logId });
    const surahs = await surahService.getAllSurahs();
    res.json({ surahs });
  } catch (error: any) {
    logger.error(`surahController: getAllSurahs - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to fetch surahs' });
  }
};

/**
 * Get progress for a specific student and surah
 */
export const getStudentSurahProgress = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { studentId, surahNumber } = req.params;

  try {
    const tenantId = getTenantId(req);
    logger.info(`surahController: getStudentSurahProgress - Fetching progress for studentId: ${studentId}, surahNumber: ${surahNumber}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const progress = await surahProgressService.getSpecificSurahProgress(
      Number(studentId),
      Number(surahNumber),
      tenantId
    );
    res.json({ progress });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`surahController: getStudentSurahProgress - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to fetch surah progress' });
  }
};

/**
 * Get all surah progress for a student
 */
export const getAllStudentProgress = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { studentId } = req.params;

  try {
    const tenantId = getTenantId(req);
    logger.info(`surahController: getAllStudentProgress - Fetching all progress for studentId: ${studentId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const progress = await surahProgressService.getStudentSurahProgress(
      Number(studentId),
      tenantId
    );
    res.json({ progress });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`surahController: getAllStudentProgress - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to fetch student progress' });
  }
};
