import { Op } from 'sequelize';
import { 
  Enrollment, 
  JuzProgress, 
  Session, 
  MemorizationRecord, 
  Attendance
} from '../model';
import { EnrollmentStatus } from '../model/Enrollment';

/**
 * Get count of active students for a tenant
 */
export const getActiveStudentsCount = async (tenantId: number) => {
  try {
    const count = await Enrollment.count({
      where: {
        tenant_id: tenantId,
        status: EnrollmentStatus.ACTIVE
      }
    });
    return { value: count, trend: '+0% this month' }; // Trend logic can be added later
  } catch (error) {
    console.error('Error in getActiveStudentsCount:', error);
    throw error;
  }
};

/**
 * Get total Juz completed across all students in a tenant
 */
export const getTotalHifzJuz = async (tenantId: number) => {
  try {
    const count = await JuzProgress.count({
      where: {
        tenant_id: tenantId,
        completed_on: { [Op.ne]: null as any }
      }
    });
    return { value: count, trend: '+0% vs last term' };
  } catch (error) {
    console.error('Error in getTotalHifzJuz:', error);
    throw error;
  }
};

/**
 * Get today's sessions count and completion status
 */
export const getTodaySessionsStats = async (tenantId: number) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const total = await Session.count({
      where: {
        tenant_id: tenantId,
        session_date: today
      }
    });

    const completed = await Session.count({
      where: {
        tenant_id: tenantId,
        session_date: today
      },
      include: [{
        model: Attendance,
        as: 'attendance',
        required: true
      }]
    });

    return { value: total, completed };
  } catch (error) {
    console.error('Error in getTodaySessionsStats:', error);
    throw error;
  }
};

/**
 * Get count of pending reviews (memorization records without instructor assignment)
 */
export const getPendingReviewsCount = async (tenantId: number) => {
  try {
    const count = await MemorizationRecord.count({
      where: {
        tenant_id: tenantId,
        instructor_id: null as any
      }
    });
    return { value: count, status: count > 0 ? 'Pending' : 'Up to date' };
  } catch (error) {
    console.error('Error in getPendingReviewsCount:', error);
    throw error;
  }
};
