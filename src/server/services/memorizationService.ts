import { MemorizationRecord, Surah, User, Session } from '../model';
import { RecordType } from '../model/MemorizationRecord';

export interface CreateMemorizationRecordDTO {
  tenant_id: number;
  session_id: number;
  student_id: number;
  instructor_id?: number;
  record_type: RecordType;
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
  is_full_surah?: boolean;
  notes?: string;
}

export interface UpdateMemorizationRecordDTO {
  instructor_id?: number;
  record_type?: RecordType;
  surah_number?: number;
  start_ayah?: number;
  end_ayah?: number;
  is_full_surah?: boolean;
  notes?: string;
}

export const createMemorizationRecord = async (data: CreateMemorizationRecordDTO) => {
  try {
    const record = await MemorizationRecord.create(data);
    return record;
  } catch (error) {
    throw error;
  }
};

export const getMemorizationRecordById = async (id: number, tenant_id: number) => {
  try {
    const record = await MemorizationRecord.findOne({
      where: { id, tenant_id },
      include: [
        { model: Surah, as: 'surah' },
        { model: User, as: 'student' },
        { model: User, as: 'instructor' },
        { model: Session, as: 'session' },
      ],
    });
    if (!record) {
      throw new Error('Memorization record not found');
    }
    return record;
  } catch (error) {
    throw error;
  }
};

export const getStudentMemorizationRecords = async (
  student_id: number,
  tenant_id: number,
  options?: {
    record_type?: RecordType;
    surah_number?: number;
    session_id?: number;
  }
) => {
  try {
    const whereClause: any = { student_id, tenant_id };
    
    if (options?.record_type) {
      whereClause.record_type = options.record_type;
    }
    if (options?.surah_number) {
      whereClause.surah_number = options.surah_number;
    }
    if (options?.session_id) {
      whereClause.session_id = options.session_id;
    }

    const records = await MemorizationRecord.findAll({
      where: whereClause,
      include: [
        { model: Surah, as: 'surah' },
        { model: User, as: 'instructor' },
      ],
      order: [['created_at', 'DESC']],
    });
    return records;
  } catch (error) {
    throw error;
  }
};

export const getSessionMemorizationRecords = async (session_id: number, tenant_id: number) => {
  try {
    const records = await MemorizationRecord.findAll({
      where: { session_id, tenant_id },
      include: [
        { model: User, as: 'student' },
        { model: Surah, as: 'surah' },
      ],
    });
    return records;
  } catch (error) {
    throw error;
  }
};

export const updateMemorizationRecord = async (
  id: number,
  tenant_id: number,
  data: UpdateMemorizationRecordDTO
) => {
  try {
    const record = await getMemorizationRecordById(id, tenant_id);
    await record.update(data);
    return record;
  } catch (error) {
    throw error;
  }
};

export const deleteMemorizationRecord = async (id: number, tenant_id: number) => {
  try {
    const record = await getMemorizationRecordById(id, tenant_id);
    await record.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};
