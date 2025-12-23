import { Attendance } from '../model';
import { AttendanceStatus } from '../model/Attendance';

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
