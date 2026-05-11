import { Surah } from '../model';

export interface CreateSurahDTO {
  number: number;
  name: string;
  ayah_count: number;
}

export interface UpdateSurahDTO {
  name?: string;
  ayah_count?: number;
}

export const createSurah = async (data: CreateSurahDTO) => {
  try {
    const surah = await Surah.create(data);
    return surah;
  } catch (error) {
    throw error;
  }
};

export const getSurahByNumber = async (number: number) => {
  try {
    const surah = await Surah.findByPk(number);
    if (!surah) {
      throw new Error('Surah not found');
    }
    return surah;
  } catch (error) {
    throw error;
  }
};

export const getAllSurahs = async () => {
  try {
    const surahs = await Surah.findAll({
      order: [['number', 'ASC']],
    });
    return surahs;
  } catch (error) {
    throw error;
  }
};

export const updateSurah = async (number: number, data: UpdateSurahDTO) => {
  try {
    const surah = await getSurahByNumber(number);
    await surah.update(data);
    return surah;
  } catch (error) {
    throw error;
  }
};

export const deleteSurah = async (number: number) => {
  try {
    const surah = await getSurahByNumber(number);
    await surah.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

export const getSurahName = async (number: number) => {
  try {
    const surah = await Surah.findByPk(number, {
      attributes: ['name'],
    });
    return surah ? surah.name : null;
  } catch (error) {
    throw error;
  }
};
