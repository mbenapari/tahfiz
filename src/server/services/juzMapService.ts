import { JuzMap, Surah } from '../model';

export interface CreateJuzMapDTO {
  juz_number: number;
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
}

export interface UpdateJuzMapDTO {
  juz_number?: number;
  surah_number?: number;
  start_ayah?: number;
  end_ayah?: number;
}

export const createJuzMap = async (data: CreateJuzMapDTO) => {
  try {
    const juzMap = await JuzMap.create(data);
    return juzMap;
  } catch (error) {
    throw error;
  }
};

export const getJuzMapById = async (id: number) => {
  try {
    const juzMap = await JuzMap.findByPk(id, {
      include: [{ model: Surah, as: 'surah' }],
    });
    if (!juzMap) {
      throw new Error('JuzMap record not found');
    }
    return juzMap;
  } catch (error) {
    throw error;
  }
};

export const getJuzMapsByJuzNumber = async (juz_number: number) => {
  try {
    const juzMaps = await JuzMap.findAll({
      where: { juz_number },
      include: [{ model: Surah, as: 'surah' }],
      order: [['surah_number', 'ASC'], ['start_ayah', 'ASC']],
    });
    return juzMaps;
  } catch (error) {
    throw error;
  }
};

export const getJuzMapsBySurahNumber = async (surah_number: number) => {
  try {
    const juzMaps = await JuzMap.findAll({
      where: { surah_number },
      order: [['juz_number', 'ASC']],
    });
    return juzMaps;
  } catch (error) {
    throw error;
  }
};

export const updateJuzMap = async (id: number, data: UpdateJuzMapDTO) => {
  try {
    const juzMap = await getJuzMapById(id);
    await juzMap.update(data);
    return juzMap;
  } catch (error) {
    throw error;
  }
};

export const deleteJuzMap = async (id: number) => {
  try {
    const juzMap = await getJuzMapById(id);
    await juzMap.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

export const getJuzForAyah = async (surah_number: number, ayah_number: number) => {
  try {
    // Find which Juz contains this specific verse
    const juzMap = await JuzMap.findOne({
      where: {
        surah_number,
      },
    });
    
    // Note: Since a Surah can span multiple Juz, we'd need more complex logic if we want to be exact.
    // However, usually one record in JuzMap covers a range.
    // Let's iterate if multiple records exist for a Surah.
    
    const candidates = await JuzMap.findAll({
        where: { surah_number }
    });

    const match = candidates.find(jm => ayah_number >= jm.start_ayah && ayah_number <= jm.end_ayah);
    
    return match ? match.juz_number : null;
  } catch (error) {
    throw error;
  }
};
