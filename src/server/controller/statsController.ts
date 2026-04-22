import { Request, Response } from 'express';
import * as statsService from '../services/statsService';

export const getActiveStudents = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const stats = await statsService.getActiveStudentsCount(tenantId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching active students count' });
  }
};

export const getTotalHifz = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const stats = await statsService.getTotalHifzJuz(tenantId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching total hifz stats' });
  }
};

export const getTodaySessions = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const stats = await statsService.getTodaySessionsStats(tenantId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching today sessions stats' });
  }
};

export const getPendingReviews = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const stats = await statsService.getPendingReviewsCount(tenantId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching pending reviews count' });
  }
};

export const getStudentStats = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const studentId = parseInt(req.params.studentId);
    
    if (isNaN(studentId)) {
      return res.status(400).json({ message: 'Invalid student ID' });
    }

    const stats = await statsService.getStudentIndividualStats(studentId, tenantId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching individual student stats' });
  }
};

export const getAttendanceTrends = async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const studentId = req.query.studentId ? parseInt(req.query.studentId as string) : undefined;
    
    const trends = await statsService.getAttendanceTrends(tenantId, studentId);
    res.json(trends);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Error fetching attendance trends' });
  }
};
