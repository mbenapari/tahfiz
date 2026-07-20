import { MemorizationRecord, RevisionRecord, Session, Surah } from '../model';
import { RecordType } from '../model/MemorizationRecord';
import logger from '../utils/logger';

interface HistoryOptions {
  type?: 'hifz' | 'revision' | 'all';
  limit?: number;
  offset?: number;
}

interface HifzHistoryRecord {
  id: number;
  sessionDate: string;
  surahName: string;
  surahNumber: number;
  startAyah: number;
  endAyah: number;
  isFullSurah: boolean;
  rating: number | null;
  notes: string | null;
  instructorNotes: string | null;
}

interface RevisionHistoryRecord {
  id: number;
  sessionDate: string;
  type: string;
  startSurah: string | null;
  endSurah: string | null;
  surahName: string | null;
  startAyah: number | null;
  endAyah: number | null;
  startPage: number | null;
  endPage: number | null;
  isFullSurah: boolean;
  notes: string | null;
}

interface HistoryResult {
  hifzRecords: HifzHistoryRecord[];
  revisionRecords: RevisionHistoryRecord[];
  pagination: {
    totalHifz: number;
    totalRevision: number;
    limit: number;
    offset: number;
  };
}

/**
 * Fetch aggregated memorization (hifz) and revision history for a student
 * within a tenant, with optional type filtering and pagination.
 */
export const getSessionHistory = async (
  studentId: number,
  tenantId: number,
  options: HistoryOptions = {}
): Promise<HistoryResult> => {
  const { type = 'all', limit = 10, offset = 0 } = options;

  try {
    const results: HistoryResult = {
      hifzRecords: [],
      revisionRecords: [],
      pagination: {
        totalHifz: 0,
        totalRevision: 0,
        limit,
        offset,
      },
    };

    // Fetch hifz (memorization) records if requested
    if (type === 'all' || type === 'hifz') {
      const { count: totalHifz, rows: hifzRows } = await MemorizationRecord.findAndCountAll({
        where: {
          student_id: studentId,
          tenant_id: tenantId,
          record_type: RecordType.MEMORIZED,
        },
        include: [
          {
            model: Session,
            as: 'session',
            attributes: ['session_date', 'notes'],
            required: true,
          },
          {
            model: Surah,
            as: 'surah',
            attributes: ['name', 'number'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      results.pagination.totalHifz = totalHifz;

      results.hifzRecords = hifzRows.map((record) => ({
        id: record.id,
        sessionDate: (record as any).session?.session_date || '',
        surahName: (record as any).surah?.name || `Surah ${record.surah_number}`,
        surahNumber: record.surah_number,
        startAyah: record.start_ayah,
        endAyah: record.end_ayah,
        isFullSurah: record.is_full_surah,
        rating: record.rating,
        notes: record.notes,
        instructorNotes: (record as any).session?.notes || null,
      }));
    }

    // Fetch revision records if requested
    if (type === 'all' || type === 'revision') {
      const { count: totalRevision, rows: revisionRows } = await RevisionRecord.findAndCountAll({
        where: {
          student_id: studentId,
          tenant_id: tenantId,
        },
        include: [
          {
            model: Session,
            as: 'session',
            attributes: ['session_date'],
            required: true,
          },
          {
            model: Surah,
            as: 'surah',
            attributes: ['name'],
          },
          {
            model: Surah,
            as: 'start_surah',
            attributes: ['name'],
          },
          {
            model: Surah,
            as: 'end_surah',
            attributes: ['name'],
          },
        ],
        order: [['created_at', 'DESC']],
        limit,
        offset,
      });

      results.pagination.totalRevision = totalRevision;

      results.revisionRecords = revisionRows.map((record) => {
        // Determine the revision type based on which fields are populated
        const revType = record.start_page || record.end_page ? 'page' : 'surah';
        return {
          id: record.id,
          sessionDate: (record as any).session?.session_date || '',
          type: revType,
          startSurah: (record as any).start_surah?.name || null,
          endSurah: (record as any).end_surah?.name || null,
          surahName: (record as any).surah?.name || null,
          startAyah: record.start_ayah,
          endAyah: record.end_ayah,
          startPage: record.start_page,
          endPage: record.end_page,
          isFullSurah: record.is_full_surah,
          rating: record.rating || null,
          notes: record.notes,
        };
      });
    }

    return results;
  } catch (error: any) {
    logger.error('sessionHistoryService.getSessionHistory: Failed to fetch history', {
      error: error.message,
      stack: error.stack,
      studentId,
      tenantId,
    });
    throw error;
  }
};
