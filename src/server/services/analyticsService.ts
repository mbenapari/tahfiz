import { Op, fn, col, literal } from 'sequelize';
import { 
  Session, 
  MemorizationRecord, 
  RevisionRecord, 
  JuzProgress,
  User,
  Attendance,
  AttendanceStatus
} from '../model';
import logger from '../utils/logger';

/**
 * Interface for metrics result
 */
export interface MetricsResult {
  daily: number;
  weekly: number;
  monthly: number;
}

/**
 * Interface for attendance breakdown
 */
export interface AttendanceBreakdown {
  label: string;
  percentage: number;
  total_sessions: number;
  present_count: number;
}

/**
 * Analytics service for calculating various metrics over time windows
 */
export const analyticsService = {
  /**
   * Get the count of unique students who logged at least one session in the given time windows.
   * Also considers last_login_at for engagement.
   * 
   * @param tenantId - The tenant ID
   * @param studentId - Optional student ID to filter by
   * @returns MetricsResult with daily, weekly, and monthly counts
   */
  getActiveStudents: async (tenantId: number, studentId?: number): Promise<MetricsResult> => {
    try {
      const now = new Date();
      const dayStart = new Date(new Date(now).setHours(0, 0, 0, 0));
      const weekStart = new Date(new Date(now).setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const getCount = async (startDate: Date) => {
        const where: any = {
          tenant_id: tenantId,
          [Op.or]: [
            { session_date: { [Op.gte]: startDate.toISOString().split('T')[0] } },
          ]
        };
        if (studentId) where.student_id = studentId;

        const sessionStudents = await Session.findAll({
          where,
          attributes: [[fn('DISTINCT', col('student_id')), 'student_id']],
          raw: true
        });

        // Also check last_login_at from User table
        const userWhere: any = {
          tenant_id: tenantId,
          last_login_at: { [Op.gte]: startDate }
        };
        if (studentId) userWhere.id = studentId;

        const loginStudents = await User.findAll({
          where: userWhere,
          attributes: ['id'],
          raw: true
        });

        const studentIds = new Set([
          ...sessionStudents.map((s: any) => s.student_id),
          ...loginStudents.map((u: any) => u.id)
        ]);

        return studentIds.size;
      };

      return {
        daily: await getCount(dayStart),
        weekly: await getCount(weekStart),
        monthly: await getCount(monthStart)
      };
    } catch (error) {
      logger.error('analyticsService.getActiveStudents: Error', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Get attendance metrics with date-range filtering
   */
  getAttendanceMetrics: async (tenantId: number, startDate: string, endDate: string, filters?: { class_name?: string, grade_level?: string, student_id?: number }) => {
    try {
      const where: any = {
        tenant_id: tenantId,
        session_date: { [Op.between]: [startDate, endDate] }
      };

      if (filters?.student_id) {
        where.student_id = filters.student_id;
      }

      const sessions = await Session.findAll({
        where,
        include: [
          {
            model: Attendance,
            as: 'attendance',
            required: true
          },
          {
            model: User,
            as: 'student',
            where: {
              ...(filters?.class_name && { class_name: filters.class_name }),
              ...(filters?.grade_level && { grade_level: filters.grade_level })
            }
          }
        ]
      }) as (Session & { attendance: Attendance, student: User })[];

      const total = sessions.length;
      const present = sessions.filter(s => s.attendance?.status === AttendanceStatus.PRESENT).length;
      const absent = sessions.filter(s => s.attendance?.status === AttendanceStatus.ABSENT).length;
      const excused = sessions.filter(s => s.attendance?.status === AttendanceStatus.EXCUSED).length;

      return {
        total,
        present,
        absent,
        excused,
        percentage: total > 0 ? (present / total) * 100 : 0
      };
    } catch (error) {
      logger.error('analyticsService.getAttendanceMetrics: Error', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Get average attendance breakdown by class, grade, and school-wide
   */
  getAttendanceBreakdown: async (tenantId: number, startDate: string, endDate: string): Promise<{ classes: AttendanceBreakdown[], grades: AttendanceBreakdown[], schoolWide: AttendanceBreakdown }> => {
    try {
      const getBreakdown = async (groupByField: 'class_name' | 'grade_level' | 'all') => {
        const groupColumn = groupByField === 'all' ? literal("'all'") : col(`student.${groupByField}`);
        
        const results = await Session.findAll({
          where: {
            tenant_id: tenantId,
            session_date: { [Op.between]: [startDate, endDate] }
          },
          attributes: [
            [groupColumn, 'label'],
            [fn('COUNT', col('Session.id')), 'total_sessions'],
            [fn('SUM', literal("CASE WHEN attendance.status = 'present' THEN 1 ELSE 0 END")), 'present_count']
          ],
          include: [
            {
              model: Attendance,
              as: 'attendance',
              attributes: [],
              required: true
            },
            {
              model: User,
              as: 'student',
              attributes: [],
              required: true
            }
          ],
          group: groupByField === 'all' ? [] : [col(`student.${groupByField}`)],
          raw: true
        }) as any[];

        return results.map(row => {
          const total = parseInt(row.total_sessions || '0');
          const present = parseInt(row.present_count || '0');
          return {
            label: row.label || 'Unassigned',
            percentage: total > 0 ? (present / total) * 100 : 0,
            total_sessions: total,
            present_count: present
          };
        });
      };

      const classes = await getBreakdown('class_name');
      const grades = await getBreakdown('grade_level');
      const schoolWideResult = await getBreakdown('all');

      return {
        classes,
        grades,
        schoolWide: schoolWideResult[0] || { label: 'School Wide', percentage: 0, total_sessions: 0, present_count: 0 }
      };
    } catch (error) {
      logger.error('analyticsService.getAttendanceBreakdown: Error', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Get student memorization progress metrics
   */
  getMemorizationProgress: async (tenantId: number, startDate: string, endDate: string, filters?: { student_id?: number, class_name?: string }) => {
    try {
      // Use date range from sessions to filter memorization records
      const where: any = {
        tenant_id: tenantId,
        record_type: 'memorized', // Only count new memorization as progress
      };

      if (filters?.student_id) {
        where.student_id = filters.student_id;
      }

      const records = await MemorizationRecord.findAll({
        where,
        include: [
          {
            model: Session,
            as: 'session',
            required: true,
            where: {
              session_date: { [Op.between]: [startDate, endDate] }
            }
          },
          {
            model: User,
            as: 'student',
            required: true,
            where: {
              ...(filters?.class_name && { class_name: filters.class_name })
            }
          }
        ]
      });

      // Calculate pages memorized (approximation: total ayahs / average ayahs per page ~ 15)
      let totalAyahs = 0;
      records.forEach(r => {
        totalAyahs += (r.end_ayah - r.start_ayah + 1);
      });

      const pagesMemorized = totalAyahs / 15;

      // Group by date for trend using session_date
      const trendMap: { [key: string]: number } = {};
      records.forEach((r: any) => {
        const date = r.session.session_date;
        trendMap[date] = (trendMap[date] || 0) + (r.end_ayah - r.start_ayah + 1);
      });

      const trend = Object.entries(trendMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({ date, pages: count / 15 }));

      return {
        pages_memorized: pagesMemorized,
        records_count: records.length,
        trend
      };
    } catch (error) {
      logger.error('analyticsService.getMemorizationProgress: Error', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Get the total number of Juz completed across students.
   * 
   * @param tenantId - The tenant ID
   * @param studentId - Optional student ID to filter by
   * @returns MetricsResult with daily, weekly, and monthly counts
   */
  getJuzCompleted: async (tenantId: number, studentId?: number): Promise<MetricsResult> => {
    try {
      const now = new Date();
      const dayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const getCount = async (startDate: Date) => {
        const where: any = {
          tenant_id: tenantId,
          completed_on: { [Op.gte]: startDate.toISOString().split('T')[0] }
        };
        if (studentId) where.student_id = studentId;

        return await JuzProgress.count({ where });
      };

      return {
        daily: await getCount(dayStart),
        weekly: await getCount(weekStart),
        monthly: await getCount(monthStart)
      };
    } catch (error) {
      logger.error('analyticsService.getJuzCompleted: Error', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Get the total count of recorded sessions.
   * 
   * @param tenantId - The tenant ID
   * @param studentId - Optional student ID to filter by
   * @returns MetricsResult with daily, weekly, and monthly counts
   */
  getSessionsCount: async (tenantId: number, studentId?: number): Promise<MetricsResult> => {
    try {
      const now = new Date();
      const dayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const getCount = async (startDate: Date) => {
        const where: any = {
          tenant_id: tenantId,
          session_date: { [Op.gte]: startDate.toISOString().split('T')[0] }
        };
        if (studentId) where.student_id = studentId;

        return await Session.count({ where });
      };

      return {
        daily: await getCount(dayStart),
        weekly: await getCount(weekStart),
        monthly: await getCount(monthStart)
      };
    } catch (error) {
      logger.error('analyticsService.getSessionsCount: Error', { error: (error as Error).message });
      throw error;
    }
  },

  /**
   * Get the total number of Juz marked as revised.
   * Since we don't have a JuzRevision model, we calculate this from RevisionRecords.
   * A Juz is considered revised if all its constituent ayahs (simplified to surahs here) 
   * have revision records in the given period.
   * 
   * @param tenantId - The tenant ID
   * @param studentId - Optional student ID to filter by
   * @returns MetricsResult with daily, weekly, and monthly counts
   */
  getJuzRevised: async (tenantId: number, studentId?: number): Promise<MetricsResult> => {
    try {
      const now = new Date();
      const dayStart = new Date(now.setHours(0, 0, 0, 0));
      const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const getCount = async (startDate: Date) => {
        const where: any = {
          tenant_id: tenantId,
          created_at: { [Op.gte]: startDate }
        };
        if (studentId) where.student_id = studentId;

        // Simplified: Count unique Juz numbers that had any revision activity
        // In a real scenario, this would involve JuzMap lookups
        const records = await RevisionRecord.findAll({
          where,
          attributes: ['surah_number'],
          raw: true
        });

        // This is a placeholder for actual Juz calculation logic
        // For now, return count of unique surahs revised as a proxy for Juz activity
        const uniqueSurahs = new Set(records.map(r => r.surah_number));
        return Math.ceil(uniqueSurahs.size / 3); // Rough proxy: ~3 surahs per Juz
      };

      return {
        daily: await getCount(dayStart),
        weekly: await getCount(weekStart),
        monthly: await getCount(monthStart)
      };
    } catch (error) {
      logger.error('analyticsService.getJuzRevised: Error', { error: (error as Error).message });
      throw error;
    }
  }
};
