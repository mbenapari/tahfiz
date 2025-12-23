import { Session, User } from '../model';

export interface CreateSessionDTO {
  tenant_id: number;
  student_id: number;
  instructor_id?: number;
  session_date: string;
  notes?: string;
}

export interface UpdateSessionDTO {
  instructor_id?: number;
  session_date?: string;
  notes?: string;
}

export const createSession = async (data: CreateSessionDTO) => {
  try {
    const session = await Session.create(data);
    return session;
  } catch (error) {
    throw error;
  }
};

export const getSessionById = async (id: number, tenant_id: number) => {
  try {
    const session = await Session.findOne({
      where: { id, tenant_id },
      include: [
        { model: User, as: 'student' },
        { model: User, as: 'instructor' },
      ],
    });
    if (!session) {
      throw new Error('Session not found');
    }
    return session;
  } catch (error) {
    throw error;
  }
};

export const getStudentSessions = async (
  student_id: number,
  tenant_id: number,
  options?: { startDate?: string; endDate?: string }
) => {
  try {
    const whereClause: any = { student_id, tenant_id };

    // Simple date filtering if needed
    // Note: For more complex date ranges with Sequelize, we'd import Op
    // import { Op } from 'sequelize';
    // if (options?.startDate && options?.endDate) {
    //   whereClause.session_date = { [Op.between]: [options.startDate, options.endDate] };
    // }

    const sessions = await Session.findAll({
      where: whereClause,
      include: [{ model: User, as: 'instructor' }],
      order: [['session_date', 'DESC']],
    });
    return sessions;
  } catch (error) {
    throw error;
  }
};

export const getSessionsByDate = async (
  tenant_id: number,
  date: string
) => {
  try {
    const sessions = await Session.findAll({
      where: { tenant_id, session_date: date },
      include: [
        { model: User, as: 'student' },
        { model: User, as: 'instructor' },
      ],
    });
    return sessions;
  } catch (error) {
    throw error;
  }
};

export const updateSession = async (
  id: number,
  tenant_id: number,
  data: UpdateSessionDTO
) => {
  try {
    const session = await getSessionById(id, tenant_id);
    await session.update(data);
    return session;
  } catch (error) {
    throw error;
  }
};

export const deleteSession = async (id: number, tenant_id: number) => {
  try {
    const session = await getSessionById(id, tenant_id);
    await session.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

export const getOrStartSession = async (
  tenant_id: number,
  student_id: number,
  date: string,
  instructor_id?: number
) => {
  try {
    // Check if session exists for this student on this date
    let session = await Session.findOne({
      where: {
        tenant_id,
        student_id,
        session_date: date,
      },
    });

    if (!session) {
      session = await createSession({
        tenant_id,
        student_id,
        session_date: date,
        instructor_id,
      });
    }

    return session;
  } catch (error) {
    throw error;
  }
};
