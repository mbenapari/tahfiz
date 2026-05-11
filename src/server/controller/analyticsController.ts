import { Request, Response } from 'express';
import { analyticsService } from '../services/analyticsService';
import logger from '../utils/logger';

/**
 * Controller for exposing analytics metrics
 */
export const analyticsController = {
  /**
   * Get active students metrics
   */
  getActiveStudents: async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.tenantId;
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      
      const metrics = await analyticsService.getActiveStudents(tenantId, studentId);
      res.json(metrics);
    } catch (error: any) {
      logger.error('analyticsController.getActiveStudents: Error', { error: error.message });
      res.status(500).json({ error: error.message || 'Error fetching active students' });
    }
  },

  /**
   * Get Juz completed metrics
   */
  getJuzCompleted: async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.tenantId;
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      
      const metrics = await analyticsService.getJuzCompleted(tenantId, studentId);
      res.json(metrics);
    } catch (error: any) {
      logger.error('analyticsController.getJuzCompleted: Error', { error: error.message });
      res.status(500).json({ error: error.message || 'Error fetching Juz completed' });
    }
  },

  /**
   * Get sessions count metrics
   */
  getSessionsCount: async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.tenantId;
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      
      const metrics = await analyticsService.getSessionsCount(tenantId, studentId);
      res.json(metrics);
    } catch (error: any) {
      logger.error('analyticsController.getSessionsCount: Error', { error: error.message });
      res.status(500).json({ error: error.message || 'Error fetching sessions count' });
    }
  },

  /**
   * Get Juz revised metrics
   */
  getJuzRevised: async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.tenantId;
      const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
      
      const metrics = await analyticsService.getJuzRevised(tenantId, studentId);
      res.json(metrics);
    } catch (error: any) {
      logger.error('analyticsController.getJuzRevised: Error', { error: error.message });
      res.status(500).json({ error: error.message || 'Error fetching Juz revised' });
    }
  },

  /**
   * Get comprehensive attendance metrics
   */
  getAttendanceMetrics: async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.tenantId;
      const { startDate, endDate, class_name, grade_level, studentId } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const metrics = await analyticsService.getAttendanceMetrics(
        tenantId, 
        startDate as string, 
        endDate as string,
        {
          class_name: class_name as string,
          grade_level: grade_level as string,
          student_id: studentId ? parseInt(studentId as string) : undefined
        }
      );
      res.json(metrics);
    } catch (error: any) {
      logger.error('analyticsController.getAttendanceMetrics: Error', { error: error.message });
      res.status(500).json({ error: error.message || 'Error fetching attendance metrics' });
    }
  },

  /**
   * Get attendance breakdown by class/grade
   */
  getAttendanceBreakdown: async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.tenantId;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const breakdown = await analyticsService.getAttendanceBreakdown(
        tenantId,
        startDate as string,
        endDate as string
      );
      res.json(breakdown);
    } catch (error: any) {
      logger.error('analyticsController.getAttendanceBreakdown: Error', { error: error.message });
      res.status(500).json({ error: error.message || 'Error fetching attendance breakdown' });
    }
  },

  /**
   * Get memorization progress metrics
   */
  getMemorizationProgress: async (req: Request, res: Response) => {
    try {
      const tenantId = (req as any).user.tenantId;
      const { startDate, endDate, studentId, class_name } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate and endDate are required' });
      }

      const progress = await analyticsService.getMemorizationProgress(
        tenantId,
        startDate as string,
        endDate as string,
        {
          student_id: studentId ? parseInt(studentId as string) : undefined,
          class_name: class_name as string
        }
      );
      res.json(progress);
    } catch (error: any) {
      logger.error('analyticsController.getMemorizationProgress: Error', { error: error.message });
      res.status(500).json({ error: error.message || 'Error fetching memorization progress' });
    }
  }
};
