import { Request, Response } from 'express';
import * as statsService from '../services/statsService';
import * as platformMetricsService from '../services/platformMetricsService';
import { getTenantId } from '../utils/schoolContext';
import logger from '../utils/logger';

export const getActiveStudents = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const tenantId = getTenantId(req);
    logger.info(`statsController: getActiveStudents - Fetching active students for tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const stats = await statsService.getActiveStudentsCount(tenantId);
    res.json(stats);
  } catch (error: any) {
    logger.error(`statsController: getActiveStudents - Error: ${error.message}`, { logId });
    res.status(500).json({ message: error.message || 'Error fetching active students count' });
  }
};

export const getTotalHifz = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const tenantId = getTenantId(req);
    logger.info(`statsController: getTotalHifz - Fetching total hifz for tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const stats = await statsService.getTotalHifzJuz(tenantId);
    res.json(stats);
  } catch (error: any) {
    logger.error(`statsController: getTotalHifz - Error: ${error.message}`, { logId });
    res.status(500).json({ message: error.message || 'Error fetching total hifz stats' });
  }
};

export const getTodaySessions = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const tenantId = getTenantId(req);
    logger.info(`statsController: getTodaySessions - Fetching today sessions for tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const stats = await statsService.getTodaySessionsStats(tenantId);
    res.json(stats);
  } catch (error: any) {
    logger.error(`statsController: getTodaySessions - Error: ${error.message}`, { logId });
    res.status(500).json({ message: error.message || 'Error fetching today sessions stats' });
  }
};

export const getPendingReviews = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const tenantId = getTenantId(req);
    logger.info(`statsController: getPendingReviews - Fetching pending reviews for tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const stats = await statsService.getPendingReviewsCount(tenantId);
    res.json(stats);
  } catch (error: any) {
    logger.error(`statsController: getPendingReviews - Error: ${error.message}`, { logId });
    res.status(500).json({ message: error.message || 'Error fetching pending reviews count' });
  }
};

export const getStudentStats = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const tenantId = getTenantId(req);
    const studentId = parseInt(req.params.studentId);
    
    if (isNaN(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    logger.info(`statsController: getStudentStats - Fetching stats for studentId: ${studentId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const stats = await statsService.getStudentIndividualStats(studentId, tenantId);
    res.json(stats);
  } catch (error: any) {
    logger.error(`statsController: getStudentStats - Error: ${error.message}`, { logId });
    res.status(500).json({ message: error.message || 'Error fetching individual student stats' });
  }
};

export const getAttendanceTrends = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const tenantId = getTenantId(req);
    const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
    
    logger.info(`statsController: getAttendanceTrends - Fetching trends for tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId,
      studentId
    });
    const trends = await statsService.getAttendanceTrends(tenantId, studentId);
    res.json(trends);
  } catch (error: any) {
    logger.error(`statsController: getAttendanceTrends - Error: ${error.message}`, { logId });
    res.status(500).json({ message: error.message || 'Error fetching attendance trends' });
  }
};

export const getPlatformMetrics = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    logger.info(`statsController: getPlatformMetrics - Fetching platform metrics`, { logId });
    const metrics = await platformMetricsService.getPlatformMetrics();
    res.json(metrics);
  } catch (error: any) {
    logger.error(`statsController: getPlatformMetrics - Error: ${error.message}`, { logId });
    res.status(500).json({ message: error.message || 'Error fetching platform metrics' });
  }
};
