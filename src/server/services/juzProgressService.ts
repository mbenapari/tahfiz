import { JuzProgress, User } from '../model';

export interface CreateJuzProgressDTO {
  tenant_id: number;
  student_id: number;
  juz_number: number;
  completed_on?: string;
  full_reads?: number;
  last_read_on?: string;
}

export interface UpdateJuzProgressDTO {
  completed_on?: string;
  full_reads?: number;
  last_read_on?: string;
}

export const createJuzProgress = async (data: CreateJuzProgressDTO) => {
  try {
    const progress = await JuzProgress.create(data);
    return progress;
  } catch (error) {
    throw error;
  }
};

export const getJuzProgressById = async (id: number, tenant_id: number) => {
  try {
    const progress = await JuzProgress.findOne({
      where: { id, tenant_id },
      include: [{ model: User, as: 'student' }],
    });
    if (!progress) {
      throw new Error('JuzProgress record not found');
    }
    return progress;
  } catch (error) {
    throw error;
  }
};

export const getStudentJuzProgress = async (student_id: number, tenant_id: number) => {
  try {
    const progress = await JuzProgress.findAll({
      where: { student_id, tenant_id },
      order: [['juz_number', 'ASC']],
    });
    return progress;
  } catch (error) {
    throw error;
  }
};

export const getSpecificJuzProgress = async (
  student_id: number,
  juz_number: number,
  tenant_id: number
) => {
  try {
    const progress = await JuzProgress.findOne({
      where: { student_id, juz_number, tenant_id },
    });
    return progress;
  } catch (error) {
    throw error;
  }
};

export const updateJuzProgress = async (
  id: number,
  tenant_id: number,
  data: UpdateJuzProgressDTO
) => {
  try {
    const progress = await getJuzProgressById(id, tenant_id);
    await progress.update(data);
    return progress;
  } catch (error) {
    throw error;
  }
};

export const deleteJuzProgress = async (id: number, tenant_id: number) => {
  try {
    const progress = await getJuzProgressById(id, tenant_id);
    await progress.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

export const incrementJuzReads = async (
  student_id: number,
  juz_number: number,
  tenant_id: number
) => {
  try {
    let progress = await JuzProgress.findOne({
      where: { student_id, juz_number, tenant_id },
    });

    if (progress) {
      await progress.update({
        full_reads: progress.full_reads + 1,
        last_read_on: new Date().toISOString().split('T')[0],
      });
    } else {
      progress = await createJuzProgress({
        student_id,
        juz_number,
        tenant_id,
        full_reads: 1,
        last_read_on: new Date().toISOString().split('T')[0],
      });
    }

    return progress;
  } catch (error) {
    throw error;
  }
};

export const markJuzCompleted = async (
  student_id: number,
  juz_number: number,
  tenant_id: number,
  completed_on?: string
) => {
  try {
    const date = completed_on || new Date().toISOString().split('T')[0];
    let progress = await JuzProgress.findOne({
      where: { student_id, juz_number, tenant_id },
    });

    if (progress) {
      await progress.update({ completed_on: date });
    } else {
      progress = await createJuzProgress({
        student_id,
        juz_number,
        tenant_id,
        completed_on: date,
      });
    }

    return progress;
  } catch (error) {
    throw error;
  }
};
