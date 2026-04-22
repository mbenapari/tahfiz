import { MemorizationRecord, Surah, JuzMap, SurahProgress, JuzProgress } from '../model';
import logger from '../utils/logger';

const TOTAL_QURAN_AYAHS = 6236;

export interface ProgressResult {
  percentage: number;
  totalAyahs: number;
  status: string;
  statusColor: string;
  barColor: string;
  currentLevel: {
    juz: number;
    surah: string;
  };
}

/**
 * Calculate student progress based on memorization records
 */
export const calculateStudentProgress = async (
  studentId: number,
  tenantId: number,
  records: any[] = []
): Promise<ProgressResult> => {
  try {
    // If no records passed, fetch them
    if (records.length === 0) {
      records = await MemorizationRecord.findAll({
        where: { student_id: studentId, tenant_id: tenantId },
        include: [{ model: Surah, as: 'surah', attributes: ['name', 'number'] }],
        order: [['created_at', 'DESC']]
      });
    }

    const uniqueAyahs = new Set<string>();
    records.forEach((record: any) => {
      const start = Number(record.start_ayah);
      const end = Number(record.end_ayah);
      for (let i = start; i <= end; i++) {
        uniqueAyahs.add(`${record.surah_number}-${i}`);
      }
    });

    const totalAyahs = uniqueAyahs.size;
    
    // Fix: Use Math.round but ensure it shows at least 1% if any ayah is memorized
    let percentage = 0;
    if (totalAyahs > 0) {
      percentage = Math.round((totalAyahs / TOTAL_QURAN_AYAHS) * 100);
      // Ensure it shows at least 1% if they have memorized something
      if (percentage === 0) percentage = 1;
    }
    
    if (percentage > 100) percentage = 100;

    let status = 'New';
    let statusColor = 'text-text-muted';
    let barColor = 'bg-text-muted';

    if (totalAyahs > 0) {
      status = 'Beginner';
      statusColor = 'text-primary';
      barColor = 'bg-primary';

      if (percentage > 20 && percentage <= 50) {
        status = 'Intermediate';
        statusColor = 'text-blue-400';
        barColor = 'bg-blue-400';
      } else if (percentage > 50 && percentage <= 80) {
        status = 'Advanced';
        statusColor = 'text-purple-400';
        barColor = 'bg-purple-400';
      } else if (percentage > 80) {
        status = 'Expert';
        statusColor = 'text-green-400';
        barColor = 'bg-green-400';
      } else if (percentage < 20) {
        status = 'Started';
      }
    }

    // Determine current level (latest record)
    let currentLevel = { juz: 30, surah: 'Amma' };
    if (records.length > 0) {
      const latest = records[0];
      if (latest.surah) {
        // Try to find the Juz for this surah/ayah
        const juzMap = await JuzMap.findOne({
          where: {
            surah_number: latest.surah_number
          }
        });
        
        currentLevel = {
          juz: juzMap ? juzMap.juz_number : 30,
          surah: latest.surah.name
        };
      }
    }

    return {
      percentage,
      totalAyahs,
      status,
      statusColor,
      barColor,
      currentLevel
    };
  } catch (error) {
    logger.error('progressService.calculateStudentProgress: Error', { error: (error as Error).message });
    throw error;
  }
};

/**
 * Update SurahProgress and JuzProgress based on new memorization records
 */
export const updateAggregatedProgress = async (
  studentId: number,
  tenantId: number,
  surahNumber: number
) => {
  try {
    // 1. Check if Surah is completed
    const surah = await Surah.findByPk(surahNumber);
    if (!surah) return;

    const records = await MemorizationRecord.findAll({
      where: { student_id: studentId, tenant_id: tenantId, surah_number: surahNumber }
    });

    const uniqueAyahs = new Set<number>();
    records.forEach(r => {
      for (let i = r.start_ayah; i <= r.end_ayah; i++) {
        uniqueAyahs.add(i);
      }
    });

    if (uniqueAyahs.size >= surah.ayah_count) {
      // Surah is fully memorized!
      await SurahProgress.upsert({
        tenant_id: tenantId,
        student_id: studentId,
        surah_number: surahNumber,
        completed_on: new Date().toISOString().split('T')[0],
        read_full_count: 1
      });

      // 2. Check if the Juz containing this Surah is also completed
      const juzMaps = await JuzMap.findAll({ where: { surah_number: surahNumber } });
      for (const jMap of juzMaps) {
        const juzNum = jMap.juz_number;
        
        // Get all surahs in this Juz
        const allJuzSurahs = await JuzMap.findAll({ where: { juz_number: juzNum } });
        let juzCompleted = true;
        
        for (const js of allJuzSurahs) {
          const sProgress = await SurahProgress.findOne({
            where: { student_id: studentId, surah_number: js.surah_number }
          });
          
          if (!sProgress || !sProgress.completed_on) {
            // Note: This is simplified. A Juz might contain parts of surahs.
            // For a robust system, we should check ayahs per Juz.
            juzCompleted = false;
            break;
          }
        }

        if (juzCompleted) {
          await JuzProgress.upsert({
            tenant_id: tenantId,
            student_id: studentId,
            juz_number: juzNum,
            completed_on: new Date().toISOString().split('T')[0],
            full_reads: 1
          });
        }
      }
    }
  } catch (error) {
    logger.error('progressService.updateAggregatedProgress: Error', { error: (error as Error).message });
  }
};
