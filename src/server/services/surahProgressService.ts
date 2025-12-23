import { SurahProgress, User, Surah } from '../model';

export interface CreateSurahProgressDTO {
  tenant_id: number;
  student_id: number;
  surah_number: number;
  completed_on?: string;
  read_full_count?: number;
  last_read_on?: string;
}

export interface UpdateSurahProgressDTO {
  completed_on?: string;
  read_full_count?: number;
  last_read_on?: string;
}

export const createSurahProgress = async (data: CreateSurahProgressDTO) => {
  try {
    const progress = await SurahProgress.create(data);
    return progress;
  } catch (error) {
    throw error;
  }
};

export const getSurahProgressById = async (id: number, tenant_id: number) => {
  try {
    const progress = await SurahProgress.findOne({
      where: { id, tenant_id },
      include: [
        { model: User, as: 'student' },
        { model: Surah, as: 'surah' },
      ],
    });
    if (!progress) {
      throw new Error('SurahProgress record not found');
    }
    return progress;
  } catch (error) {
    throw error;
  }
};

export const getStudentSurahProgress = async (student_id: number, tenant_id: number) => {
  try {
    const progress = await SurahProgress.findAll({
      where: { student_id, tenant_id },
      include: [{ model: Surah, as: 'surah' }],
      order: [['surah_number', 'ASC']],
    });
    return progress;
  } catch (error) {
    throw error;
  }
};

export const getSpecificSurahProgress = async (
  student_id: number,
  surah_number: number,
  tenant_id: number
) => {
  try {
    const progress = await SurahProgress.findOne({
      where: { student_id, surah_number, tenant_id },
    });
    return progress;
  } catch (error) {
    throw error;
  }
};

export const updateSurahProgress = async (
  id: number,
  tenant_id: number,
  data: UpdateSurahProgressDTO
) => {
  try {
    const progress = await getSurahProgressById(id, tenant_id);
    await progress.update(data);
    return progress;
  } catch (error) {
    throw error;
  }
};

export const deleteSurahProgress = async (id: number, tenant_id: number) => {
  try {
    const progress = await getSurahProgressById(id, tenant_id);
    await progress.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

export const incrementSurahReads = async (
  student_id: number,
  surah_number: number,
  tenant_id: number
) => {
  try {
    let progress = await SurahProgress.findOne({
      where: { student_id, surah_number, tenant_id },
    });

    if (progress) {
      await progress.update({
        read_full_count: progress.read_full_count + 1,
        last_read_on: new Date().toISOString().split('T')[0],
      });
    } else {
      progress = await createSurahProgress({
        student_id,
        surah_number,
        tenant_id,
        read_full_count: 1,
        completed_on: new Date().toISOString().split('T')[0],
        last_read_on: new Date().toISOString().split('T')[0],
      });
    }

    return progress;
  } catch (error) {
    throw error;
  }
};

export const markSurahCompleted = async (
  student_id: number,
  surah_number: number,
  tenant_id: number,
  completed_on?: string
) => {
  try {
    const date = completed_on || new Date().toISOString().split('T')[0];
    let progress = await SurahProgress.findOne({
      where: { student_id, surah_number, tenant_id },
    });

    if (progress) {
      await progress.update({ completed_on: date });
    } else {
      progress = await createSurahProgress({
        student_id,
        surah_number,
        tenant_id,
        completed_on: date,
        read_full_count: 1,
        last_read_on: date,
      });
    }

    return progress;
  } catch (error) {
    throw error;
  }
};
