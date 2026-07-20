import { Request, Response } from 'express';
import * as feedbackService from '../services/feedbackService';
import logger from '../utils/logger';
import { getTenantId } from '../utils/schoolContext';

export const submitFeedback = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
    const tenantId = getTenantId(req);
    logger.info(`feedbackController: submitFeedback - Submitting feedback for userId: ${userId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const { category, subject, message } = req.body;

    if (!category || !subject || !message) {
      return res.status(400).json({ error: 'Category, subject, and message are required' });
    }

    const feedback = await feedbackService.submitFeedback({
      user_id: userId,
      tenant_id: tenantId,
      category,
      subject,
      message
    });

    logger.info(`feedbackController: submitFeedback - Success: feedbackId: ${feedback.id}`, { logId });
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`feedbackController: submitFeedback - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

export const getAllFeedbacks = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';

  try {
    logger.info(`feedbackController: getAllFeedbacks - Fetching all feedbacks`, { logId });
    const feedbacks = await feedbackService.getAllFeedbacks();
    res.json({ feedbacks });
  } catch (error: any) {
    logger.error(`feedbackController: getAllFeedbacks - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
};

export const updateFeedback = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { id } = req.params;

  try {
    const { status, adminNotes } = req.body;
    logger.info(`feedbackController: updateFeedback - Updating feedbackId: ${id}`, { logId, status });
    
    const feedback = await feedbackService.updateFeedbackStatus(Number(id), {
      status,
      admin_notes: adminNotes
    });

    logger.info(`feedbackController: updateFeedback - Success: feedbackId: ${id}`, { logId });
    res.json({ message: 'Feedback updated successfully', feedback });
  } catch (error: any) {
    logger.error(`feedbackController: updateFeedback - Error: ${error.message}`, { logId, id });
    res.status(500).json({ error: 'Failed to update feedback' });
  }
};

export const deleteFeedback = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { id } = req.params;

  try {
    logger.info(`feedbackController: deleteFeedback - Deleting feedbackId: ${id}`, { logId });
    await feedbackService.deleteFeedback(Number(id));
    logger.info(`feedbackController: deleteFeedback - Success: feedbackId: ${id}`, { logId });
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error: any) {
    logger.error(`feedbackController: deleteFeedback - Error: ${error.message}`, { logId, id });
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
};
