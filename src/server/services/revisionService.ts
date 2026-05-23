import { RevisionRecord, Surah, User, Session } from '../model';

export interface CreateRevisionRecordDTO {
  tenant_id: number;
  session_id: number;
  student_id: number;
  instructor_id?: number;
  surah_number?: number;
  start_surah_number?: number;
  end_surah_number?: number;
  start_ayah?: number;
  end_ayah?: number;
  start_page?: number;
  end_page?: number;
  is_full_surah?: boolean;
  notes?: string;
}

export interface UpdateRevisionRecordDTO {
  instructor_id?: number;
  surah_number?: number;
  start_surah_number?: number;
  end_surah_number?: number;
  start_ayah?: number;
  end_ayah?: number;
  start_page?: number;
  end_page?: number;
  is_full_surah?: boolean;
  notes?: string;
}

export const createRevisionRecord = async (data: CreateRevisionRecordDTO) => {
  try {
    const record = await RevisionRecord.create(data);
    return record;
  } catch (error) {
    throw error;
  }
};

export const getRevisionRecordById = async (id: number, tenant_id: number) => {
  try {
    const record = await RevisionRecord.findOne({
      where: { id, tenant_id },
      include: [
        { model: Surah, as: 'surah' },
        { model: Surah, as: 'start_surah' },
        { model: Surah, as: 'end_surah' },
        { model: User, as: 'student' },
        { model: User, as: 'instructor' },
        { model: Session, as: 'session' },
      ],
    });
    if (!record) {
      throw new Error('Revision record not found');
    }
    return record;
  } catch (error) {
    throw error;
  }
};

export const getStudentRevisionRecords = async (
  student_id: number,
  tenant_id: number,
  options?: {
    surah_number?: number;
    session_id?: number;
  }
) => {
  try {
    const whereClause: any = { student_id, tenant_id };

    if (options?.surah_number) {
      whereClause.surah_number = options.surah_number;
    }
    if (options?.session_id) {
      whereClause.session_id = options.session_id;
    }

    const records = await RevisionRecord.findAll({
      where: whereClause,
      include: [
        { model: Surah, as: 'surah' },
        { model: Surah, as: 'start_surah' },
        { model: Surah, as: 'end_surah' },
        { model: User, as: 'instructor' },
      ],
      order: [['created_at', 'DESC']],
    });
    return records;
  } catch (error) {
    throw error;
  }
};

export const getSessionRevisionRecords = async (session_id: number, tenant_id: number) => {
  try {
    const records = await RevisionRecord.findAll({
      where: { session_id, tenant_id },
      include: [
        { model: User, as: 'student' },
        { model: Surah, as: 'surah' },
        { model: Surah, as: 'start_surah' },
        { model: Surah, as: 'end_surah' },
      ],
    });
    return records;
  } catch (error) {
    throw error;
  }
};

export const updateRevisionRecord = async (
  id: number,
  tenant_id: number,
  data: UpdateRevisionRecordDTO
) => {
  try {
    const record = await getRevisionRecordById(id, tenant_id);
    await record.update(data);
    return record;
  } catch (error) {
    throw error;
  }
};

export const deleteRevisionRecord = async (id: number, tenant_id: number) => {
  try {
    const record = await getRevisionRecordById(id, tenant_id);
    await record.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};
