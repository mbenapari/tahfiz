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
    const totalQuranAyahs = 6236;
    const memorizationRecords = await MemorizationRecord.findAll({
      where: { student_id: studentId, tenant_id: tenantId },
      attributes: ['surah_number', 'start_ayah', 'end_ayah']
    });

    const uniqueAyahs = new Set();
    memorizationRecords.forEach((record: any) => {
      for(let i = record.start_ayah; i <= record.end_ayah; i++) {
        uniqueAyahs.add(`${record.surah_number}-${i}`);
      }
    });
    
    const totalAyahsMemorized = uniqueAyahs.size;
    const completionPercentage = Math.round((totalAyahsMemorized / totalQuranAyahs) * 100);

    return {
      studentId,
      totalSessions,
      attendanceRate,
      totalAyahsMemorized,
      completionPercentage
    };
  } catch (error) {
    console.error('Error in getStudentIndividualStats:', error);
    throw error;
  }
};
