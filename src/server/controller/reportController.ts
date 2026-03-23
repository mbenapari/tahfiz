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
