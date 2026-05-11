import { Request, Response } from 'express';
import * as reportService from '../services/reportService';
import logger from '../utils/logger';

export const getStudentReport = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  try {
    const reportData = await reportService.getStudentReport(Number(id), tenantId);
    res.json(reportData);
  } catch (error: any) {
    logger.error('reportController.getStudentReport: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to generate student report' });
  }
};

export const downloadStudentReportCSV = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  try {
    const csvData = await reportService.generateStudentReportCSV(Number(id), tenantId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=student_report_${id}.csv`);
    res.status(200).send(csvData);
  } catch (error: any) {
    logger.error('reportController.downloadStudentReportCSV: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to download student report' });
  }
};

export const getSchoolPerformanceReport = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const { startDate, endDate } = req.query;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  try {
    const reportData = await reportService.getSchoolPerformanceReport(
      tenantId, 
      startDate as string, 
      endDate as string
    );
    res.json(reportData);
  } catch (error: any) {
    logger.error('reportController.getSchoolPerformanceReport: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to generate school performance report' });
  }
};

export const getStudentsPerformanceList = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const { class_name, grade_level } = req.query;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  try {
    const data = await reportService.getPaginatedStudentsReport(
      tenantId, 
      page, 
      limit,
      {
        class_name: class_name as string,
        grade_level: grade_level as string
      }
    );
    res.json(data);
  } catch (error: any) {
    logger.error('reportController.getStudentsPerformanceList: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to fetch students performance list' });
  }
};

export const downloadOverallPerformanceCSV = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const { startDate, endDate } = req.query;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  try {
    const csvData = await reportService.generateOverallPerformanceCSV(tenantId, startDate as string, endDate as string);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=overall_performance_${startDate}_${endDate}.csv`);
    res.status(200).send(csvData);
  } catch (error: any) {
    logger.error('reportController.downloadOverallPerformanceCSV: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to download overall performance report' });
  }
};

export const downloadOverallAttendanceCSV = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const { startDate, endDate } = req.query;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  try {
    const csvData = await reportService.generateOverallAttendanceCSV(tenantId, startDate as string, endDate as string);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=overall_attendance_${startDate}_${endDate}.csv`);
    res.status(200).send(csvData);
  } catch (error: any) {
    logger.error('reportController.downloadOverallAttendanceCSV: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to download overall attendance report' });
  }
};
