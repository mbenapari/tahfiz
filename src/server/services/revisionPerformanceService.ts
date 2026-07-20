import { RevisionRecord } from '../model';
import { RevisionRating, REVISION_RATING_LABELS, REVISION_RATING_CRITERIA } from '../model/RevisionRecord';
import logger from '../utils/logger';

/** Re-export rating enums and metadata for convenience */
export { RevisionRating, REVISION_RATING_LABELS, REVISION_RATING_CRITERIA };

/** DTO for submitting/updating a revision performance rating */
export interface RevisionPerformanceDTO {
  rating: number;
}

/**
 * Update the performance rating on an existing revision record.
 * Validates rating is within 1-5 range.
 */
export const updateRevisionRating = async (
  revisionRecordId: number,
  tenant_id: number,
  data: RevisionPerformanceDTO,
  correlationId?: string
) => {
  const logId = correlationId || 'unknown';
  try {
    // Validate rating range
    const rating = Number(data.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('Rating must be an integer between 1 and 5');
    }

    const record = await RevisionRecord.findOne({
      where: { id: revisionRecordId, tenant_id },
    });

    if (!record) {
      throw new Error('Revision record not found');
    }

    await record.update({ rating });

    logger.info('Revision rating updated', {
      correlationId: logId,
      revisionRecordId,
      rating,
      studentId: record.student_id,
    });

    return {
      revisionRecordId,
      rating,
      label: REVISION_RATING_LABELS[rating as RevisionRating],
      criteria: REVISION_RATING_CRITERIA[rating as RevisionRating],
    };
  } catch (error: any) {
    logger.error('Failed to update revision rating', {
      correlationId: logId,
      error: error.message,
      stack: error.stack,
      revisionRecordId,
    });
    throw error;
  }
};

/**
 * Get the performance rating for a specific revision record.
 */
export const getRevisionRating = async (
  revisionRecordId: number,
  tenant_id: number,
  correlationId?: string
) => {
  const logId = correlationId || 'unknown';
  try {
    const record = await RevisionRecord.findOne({
      where: { id: revisionRecordId, tenant_id },
      attributes: ['id', 'rating'],
    });

    if (!record) {
      throw new Error('Revision record not found');
    }

    const rating = record.rating as RevisionRating | null;

    if (rating === null || rating === undefined) {
      return {
        revisionRecordId: record.id,
        rating: null,
        label: 'Not Rated',
        criteria: null,
      };
    }

    return {
      revisionRecordId: record.id,
      rating,
      label: REVISION_RATING_LABELS[rating],
      criteria: REVISION_RATING_CRITERIA[rating],
    };
  } catch (error: any) {
    logger.error('Failed to get revision rating', {
      correlationId: logId,
      error: error.message,
      stack: error.stack,
      revisionRecordId,
    });
    throw error;
  }
};

/**
 * Get aggregate performance statistics for a student's revision sessions.
 */
export const getStudentRevisionStats = async (
  studentId: number,
  tenant_id: number,
  correlationId?: string
) => {
  const logId = correlationId || 'unknown';
  try {
    const records = await RevisionRecord.findAll({
      where: { student_id: studentId, tenant_id },
      attributes: ['rating'],
      raw: true,
    });

    const ratings = records
      .map((r: any) => r.rating)
      .filter((r: number | null) => r !== null && r !== undefined) as number[];

    if (ratings.length === 0) {
      return {
        totalRevisionSessions: records.length,
        ratedSessions: 0,
        averageRating: null,
        ratingDistribution: {},
      };
    }

    // Calculate rating distribution
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach((r) => {
      distribution[r] = (distribution[r] || 0) + 1;
    });

    const averageRating = (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(2);

    logger.info('Student revision stats calculated', {
      correlationId: logId,
      studentId,
      totalSessions: records.length,
      ratedSessions: ratings.length,
      averageRating,
    });

    return {
      totalRevisionSessions: records.length,
      ratedSessions: ratings.length,
      averageRating: parseFloat(averageRating),
      ratingDistribution: distribution,
    };
  } catch (error: any) {
    logger.error('Failed to get student revision stats', {
      correlationId: logId,
      error: error.message,
      stack: error.stack,
      studentId,
    });
    throw error;
  }
};
