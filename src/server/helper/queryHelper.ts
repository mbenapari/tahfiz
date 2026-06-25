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

/**
 * Builds a search where clause for model queries.
 * Consolidates duplicate logic for searching by name, email, etc.
 * Sanitizes query to prevent performance issues with wildcard prefixes and length limits.
 * Uses substring matching (%query%) for better user experience.
 */
export const buildSearchWhereClause = (query: string, fields: string[] = [], maxLength: number = 50) => {
  if (!query || typeof query !== 'string') return {};

  const trimmedQuery = query.trim();
  if (!trimmedQuery) return {};

  // Length limiting to prevent ReDoS or performance issues
  const limitedQuery = trimmedQuery.substring(0, maxLength);

  // Sanitize query: strip SQL LIKE wildcards to prevent unintended patterns
  const sanitizedQuery = limitedQuery.replace(/[%_]/g, '');
  if (!sanitizedQuery) return {};

  // Use substring matching (both sides wildcard) for better UX
  const likePattern = `%${sanitizedQuery}%`;

  return {
    [Op.or]: fields.map(field => ({ [field]: { [Op.iLike]: likePattern } }))
  };
};
