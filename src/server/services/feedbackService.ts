import { Feedback, User, School } from '../model';
import { FeedbackCategory, FeedbackStatus } from '../model/Feedback';
import logger from '../utils/logger';

export interface CreateFeedbackDTO {
  user_id: number;
  tenant_id?: number | null;
  category: FeedbackCategory;
  subject: string;
  message: string;
}

export interface UpdateFeedbackDTO {
  status?: FeedbackStatus;
  admin_notes?: string;
}

export const submitFeedback = async (data: CreateFeedbackDTO) => {
  try {
    const feedback = await Feedback.create(data);
    return feedback;
  } catch (error: any) {
    logger.error('feedbackService.submitFeedback: Error', { error: error.message });
    throw error;
  }
};

export const getAllFeedbacks = async () => {
  try {
    const feedbacks = await Feedback.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        },
        {
          model: School,
          as: 'tenant',
          attributes: ['id', 'name']
        }
      ],
      order: [['created_at', 'DESC']]
    });
    return feedbacks;
  } catch (error: any) {
    logger.error('feedbackService.getAllFeedbacks: Error', { error: error.message });
    throw error;
  }
};

export const getFeedbackById = async (id: number) => {
  try {
    const feedback = await Feedback.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'first_name', 'last_name', 'email', 'phone']
        },
        {
          model: School,
          as: 'tenant',
          attributes: ['id', 'name']
        }
      ]
    });
    return feedback;
  } catch (error: any) {
    logger.error('feedbackService.getFeedbackById: Error', { id, error: error.message });
    throw error;
  }
};

export const updateFeedbackStatus = async (id: number, data: UpdateFeedbackDTO) => {
  try {
    const feedback = await Feedback.findByPk(id);
    if (!feedback) throw new Error('Feedback not found');

    await feedback.update(data);
    return feedback;
  } catch (error: any) {
    logger.error('feedbackService.updateFeedbackStatus: Error', { id, error: error.message });
    throw error;
  }
};

export const deleteFeedback = async (id: number) => {
  try {
    const feedback = await Feedback.findByPk(id);
    if (!feedback) throw new Error('Feedback not found');

    await feedback.destroy();
    return true;
  } catch (error: any) {
    logger.error('feedbackService.deleteFeedback: Error', { id, error: error.message });
    throw error;
  }
};
