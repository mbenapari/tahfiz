import { Op } from 'sequelize';
import { 
  Enrollment, 
  JuzProgress, 
  Session, 
  MemorizationRecord, 
  Attendance,
  User,
  Surah
} from '../model';
import { EnrollmentStatus } from '../model/Enrollment';
import * as progressService from './progressService';
import * as attendanceService from './attendanceService';
import logger from '../utils/logger';

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
  } catch (error: any) {
    logger.error(`[statsService] getActiveStudentsCount Error: ${error.message}`, { tenantId });
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
  } catch (error: any) {
    logger.error(`[statsService] getTotalHifzJuz Error: ${error.message}`, { tenantId });
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
  } catch (error: any) {
    logger.error(`[statsService] getTodaySessionsStats Error: ${error.message}`, { tenantId });
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
  } catch (error: any) {
    logger.error(`[statsService] getPendingReviewsCount Error: ${error.message}`, { tenantId });
    throw error;
  }
};

/**
 * Get individual student statistics: total sessions, attendance rate, and completion percentage
 */
export const getStudentIndividualStats = async (studentId: number, tenantId: number) => {
  try {
    // 1. Total Sessions - Count sessions where attendance is recorded (even if absent)
    const sessions = await Session.findAll({
      where: {
        student_id: studentId,
        tenant_id: tenantId
      },
      include: [{
        model: Attendance,
        as: 'attendance',
        required: false // We want all sessions, but we'll use attendance to verify
      }]
    });

    const totalSessions = sessions.length;

    // 2. Attendance Rate
    const presentSessions = sessions.filter((s: any) => s.attendance?.status === 'present').length;
    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

    // 3. Completion Percentage (Quran Memorization)
    const calculatedProgress = await progressService.calculateStudentProgress(studentId, tenantId);

    return {
      studentId,
      totalSessions,
      attendanceRate,
      totalAyahsMemorized: calculatedProgress.totalAyahs,
      completionPercentage: calculatedProgress.percentage
    };
  } catch (error: any) {
    logger.error(`[statsService] getStudentIndividualStats Error: ${error.message}`, { studentId, tenantId });
    throw error;
  }
};

/**
 * Get attendance trends
 */
export const getAttendanceTrends = async (tenantId: number, studentId?: number) => {
  return await attendanceService.getAttendanceTrends(tenantId, studentId);
};
