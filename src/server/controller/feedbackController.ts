import { Request, Response } from 'express';
import * as feedbackService from '../services/feedbackService';
import logger from '../utils/logger';

export const submitFeedback = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const userId = req.user?.userId;
  const tenantId = req.user?.tenantId;

  if (!userId) {
    return res.status(401).json({ error: 'User not authenticated' });
  }

  try {
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

    logger.info('feedbackController.submitFeedback: Success', { correlationId, feedbackId: feedback.id });
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (error: any) {
    logger.error('feedbackController.submitFeedback: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

export const getAllFeedbacks = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;

  try {
    const feedbacks = await feedbackService.getAllFeedbacks();
    res.json({ feedbacks });
  } catch (error: any) {
    logger.error('feedbackController.getAllFeedbacks: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to fetch feedbacks' });
  }
};

export const updateFeedback = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    const { status, adminNotes } = req.body;
    
    const feedback = await feedbackService.updateFeedbackStatus(Number(id), {
      status,
      admin_notes: adminNotes
    });

    logger.info('feedbackController.updateFeedback: Success', { correlationId, feedbackId: id });
    res.json({ message: 'Feedback updated successfully', feedback });
  } catch (error: any) {
    logger.error('feedbackController.updateFeedback: Error', { correlationId, id, error: error.message });
    res.status(500).json({ error: 'Failed to update feedback' });
  }
};

export const deleteFeedback = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    await feedbackService.deleteFeedback(Number(id));
    logger.info('feedbackController.deleteFeedback: Success', { correlationId, feedbackId: id });
    res.json({ message: 'Feedback deleted successfully' });
  } catch (error: any) {
    logger.error('feedbackController.deleteFeedback: Error', { correlationId, id, error: error.message });
    res.status(500).json({ error: 'Failed to delete feedback' });
  }
};
