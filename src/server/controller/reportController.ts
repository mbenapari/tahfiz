import { Request, Response } from 'express';
import * as reportService from '../services/reportService';
import logger from '../utils/logger';
import { getTenantId } from '../utils/schoolContext';

export const getStudentReport = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { id } = req.params;

  try {
    const tenantId = getTenantId(req);
    logger.info(`reportController: getStudentReport - Fetching report for studentId: ${id}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const reportData = await reportService.getStudentReport(Number(id), tenantId);
    res.json(reportData);
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`reportController: getStudentReport - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to generate student report' });
  }
};

export const downloadStudentReportCSV = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { id } = req.params;

  try {
    const tenantId = getTenantId(req);
    logger.info(`reportController: downloadStudentReportCSV - Generating CSV for studentId: ${id}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const csvData = await reportService.generateStudentReportCSV(Number(id), tenantId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=student_report_${id}.csv`);
    res.status(200).send(csvData);
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`reportController: downloadStudentReportCSV - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to download student report' });
  }
};

export const getSchoolPerformanceReport = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  try {
    const tenantId = getTenantId(req);
    logger.info(`reportController: getSchoolPerformanceReport - Fetching performance for tenantId: ${tenantId}, range: ${startDate} to ${endDate}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const reportData = await reportService.getSchoolPerformanceReport(
      tenantId, 
      startDate as string, 
      endDate as string
    );
    res.json(reportData);
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`reportController: getSchoolPerformanceReport - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to generate school performance report' });
  }
};

export const getStudentsPerformanceList = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const { class_name, grade_level } = req.query;

  try {
    const tenantId = getTenantId(req);
    logger.info(`reportController: getStudentsPerformanceList - Fetching performance list for tenantId: ${tenantId}, page: ${page}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
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
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`reportController: getStudentsPerformanceList - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to fetch students performance list' });
  }
};

export const downloadOverallPerformanceCSV = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  try {
    const tenantId = getTenantId(req);
    logger.info(`reportController: downloadOverallPerformanceCSV - Generating CSV for tenantId: ${tenantId}, range: ${startDate} to ${endDate}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const csvData = await reportService.generateOverallPerformanceCSV(tenantId, startDate as string, endDate as string);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=overall_performance_${startDate}_${endDate}.csv`);
    res.status(200).send(csvData);
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`reportController: downloadOverallPerformanceCSV - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to download overall performance report' });
  }
};

export const downloadOverallAttendanceCSV = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    return res.status(400).json({ error: 'startDate and endDate are required' });
  }

  try {
    const tenantId = getTenantId(req);
    logger.info(`reportController: downloadOverallAttendanceCSV - Generating CSV for tenantId: ${tenantId}, range: ${startDate} to ${endDate}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const csvData = await reportService.generateOverallAttendanceCSV(tenantId, startDate as string, endDate as string);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=overall_attendance_${startDate}_${endDate}.csv`);
    res.status(200).send(csvData);
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`reportController: downloadOverallAttendanceCSV - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to download overall attendance report' });
  }
};
