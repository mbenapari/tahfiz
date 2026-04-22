import { Op } from 'sequelize';
import { Attendance, Session } from '../model';
import { AttendanceStatus } from '../model/Attendance';
import logger from '../utils/logger';

export interface AttendanceTrendData {
  week: string;
  value: number; // percentage
  totalAttendees: number;
  averageAttendance: number;
}

export interface AttendanceTrendsResponse {
  trends: AttendanceTrendData[];
  currentAverage: number;
  trendPercentage: number;
}

export interface CreateAttendanceDTO {
  session_id: number;
  status?: AttendanceStatus;
  recorded_by?: number;
  recorded_at?: Date;
}

export interface UpdateAttendanceDTO {
  status?: AttendanceStatus;
  recorded_by?: number;
  recorded_at?: Date;
}

export const createAttendance = async (data: CreateAttendanceDTO) => {
  try {
    const attendance = await Attendance.create(data);
    return attendance;
  } catch (error) {
    throw error;
  }
};

export const getAttendanceById = async (id: number) => {
  try {
    const attendance = await Attendance.findByPk(id);
    if (!attendance) {
      throw new Error('Attendance record not found');
    }
    return attendance;
  } catch (error) {
    throw error;
  }
};

export const getAttendanceBySessionId = async (session_id: number) => {
  try {
    const attendance = await Attendance.findOne({
      where: { session_id },
    });
    return attendance;
  } catch (error) {
    throw error;
  }
};

export const updateAttendance = async (id: number, data: UpdateAttendanceDTO) => {
  try {
    const attendance = await getAttendanceById(id);
    await attendance.update(data);
    return attendance;
  } catch (error) {
    throw error;
  }
};

export const deleteAttendance = async (id: number) => {
  try {
    const attendance = await getAttendanceById(id);
    await attendance.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

export const markAttendance = async (
  session_id: number,
  status: AttendanceStatus,
  recorded_by: number
) => {
  try {
    // Check if attendance already exists for this session
    const existingAttendance = await Attendance.findOne({
      where: { session_id },
    });

    if (existingAttendance) {
      return await existingAttendance.update({
        status,
        recorded_by,
        recorded_at: new Date(),
      });
    }

    return await createAttendance({
      session_id,
      status,
      recorded_by,
      recorded_at: new Date(),
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Get attendance trends for the past 8 weeks
 * 
 * @param tenantId - The tenant ID
 * @param studentId - Optional student ID to filter by
 * @returns AttendanceTrendsResponse with weekly metrics
 */
export const getAttendanceTrends = async (
  tenantId: number,
  studentId?: number
): Promise<AttendanceTrendsResponse> => {
  try {
    const now = new Date();
    const trends: AttendanceTrendData[] = [];
    const weeksToFetch = 8;

    for (let i = weeksToFetch - 1; i >= 0; i--) {
      // Calculate start and end of the week
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (i * 7 + now.getDay()));
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const where: any = {
        tenant_id: tenantId,
        session_date: {
          [Op.between]: [
            startOfWeek.toISOString().split('T')[0],
            endOfWeek.toISOString().split('T')[0]
          ]
        }
      };
      if (studentId) where.student_id = studentId;

      // Find all sessions in this week
      const sessions = await Session.findAll({
        where,
        include: [{
          model: Attendance,
          as: 'attendance',
          required: false
        }]
      });

      const totalSessions = sessions.length;
      const presentSessions = sessions.filter((s: any) => s.attendance?.status === AttendanceStatus.PRESENT).length;
      
      const attendancePercentage = totalSessions > 0 
        ? Math.round((presentSessions / totalSessions) * 100) 
        : 0;

      trends.push({
        week: `W${weeksToFetch - i}`,
        value: attendancePercentage,
        totalAttendees: presentSessions,
        averageAttendance: attendancePercentage
      });
    }

    const currentAverage = trends[trends.length - 1].value;
    const previousAverage = trends.length > 1 ? trends[trends.length - 2].value : 0;
    const trendPercentage = previousAverage > 0 
      ? Math.round(((currentAverage - previousAverage) / previousAverage) * 100 * 10) / 10 
      : 0;

    return {
      trends,
      currentAverage,
      trendPercentage
    };
  } catch (error) {
    logger.error('attendanceService.getAttendanceTrends: Error', { error: (error as Error).message });
    throw error;
  }
};
