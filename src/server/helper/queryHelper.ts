import { fn, col, Op } from 'sequelize';
import { JuzProgress, SurahProgress } from '../model/index.js';

export const hasCompletedJuz = async (
  tenantId: number,
  studentId: number,
  juzNumber: number
): Promise<boolean> => {
  const record = await JuzProgress.findOne({
    where: {
      tenant_id: tenantId,
      student_id: studentId,
      juz_number: juzNumber
    },
    attributes: ['full_reads']
  });

  return !!record && record.full_reads >= 3;
};

export const getNextSurah = async (
  tenantId: number,
  studentId: number
): Promise<number | null> => {
  const result = await SurahProgress.findOne({
    where: {
      tenant_id: tenantId,
      student_id: studentId
    },
    attributes: [[fn('MAX', col('surah_number')), 'lastSurah']],
    raw: true
  }) as unknown as { lastSurah: number } | null;

  const lastSurah = Number(result?.lastSurah ?? 0);
  const next = lastSurah + 1;

  return next <= 114 ? next : null;
};

export const getNextJuz = async (
  tenantId: number,
  studentId: number
): Promise<number | null> => {
  const result = await JuzProgress.findOne({
    where: {
      tenant_id: tenantId,
      student_id: studentId,
      full_reads: { [Op.gte]: 3 }
    },
    attributes: [[fn('MAX', col('juz_number')), 'lastJuz']],
    raw: true
  }) as unknown as { lastJuz: number } | null;

  const lastJuz = Number(result?.lastJuz ?? 0);
  const next = lastJuz + 1;

  return next <= 30 ? next : null;
};

export const canMoveToNextSurah = async (
  tenantId: number,
  studentId: number,
  surahNumber: number
): Promise<boolean> => {
  const record = await SurahProgress.findOne({
    where: {
      tenant_id: tenantId,
      student_id: studentId,
      surah_number: surahNumber
    },
    attributes: ['read_full_count']
  });

  return !!record && record.read_full_count >= 1;
};
