export interface MasterySurah {
  number: number;
  name: string;
  ayah_count: number;
}

export interface MemorizationRecordMinimal {
  surah_number: number;
  start_ayah: number;
  end_ayah: number;
}

export interface RevisionRecordMinimal {
  surah_number?: number;
  start_surah_number?: number;
  end_surah_number?: number;
  start_ayah?: number;
  end_ayah?: number;
}

export const calculateMasteryData = (
  allSurahs: MasterySurah[],
  memorizationRecords: MemorizationRecordMinimal[],
  revisionRecords: RevisionRecordMinimal[]
) => {
  const mBySurah = new Map<number, MemorizationRecordMinimal[]>();
  for (const r of memorizationRecords) {
    const arr = mBySurah.get(r.surah_number) ?? [];
    arr.push(r);
    mBySurah.set(r.surah_number, arr);
  }

  const rBySurah = new Map<number, RevisionRecordMinimal[]>();
  for (const r of revisionRecords) {
    if (r.surah_number !== undefined && r.surah_number !== null) {
      const arr = rBySurah.get(r.surah_number) ?? [];
      arr.push(r);
      rBySurah.set(r.surah_number, arr);
    } else if (r.start_surah_number !== undefined && r.start_surah_number !== null && 
               r.end_surah_number !== undefined && r.end_surah_number !== null) {
      const start = Math.min(r.start_surah_number, r.end_surah_number);
      const end = Math.max(r.start_surah_number, r.end_surah_number);
      const validStart = Math.max(1, start);
      const validEnd = Math.min(114, end);

      for (let i = validStart; i <= validEnd; i++) {
        const arr = rBySurah.get(i) ?? [];
        arr.push(r);
        rBySurah.set(i, arr);
      }
    }
  }

  return allSurahs.map(surah => {
    const sNum = surah.number;
    const mRecords = mBySurah.get(sNum) ?? [];
    const rRecords = rBySurah.get(sNum) ?? [];

    let status = 0; // Not Started
    let details = 'Not started yet';

    if (mRecords.length > 0) {
      status = 1; // Memorized
      const start = Math.min(...mRecords.map(r => r.start_ayah));
      const end = Math.max(...mRecords.map(r => r.end_ayah));
      
      if (start === 1 && end === surah.ayah_count) {
        details = `Fully Memorized (1-${surah.ayah_count})`;
      } else {
        details = `Memorized Ayahs: ${start}-${end}`;
      }
    }

    if (rRecords.length > 0) {
      status = 2; // Needs Revision
      const detailsList = rRecords.map(r => {
        const hasStart = r.start_surah_number !== undefined && r.start_surah_number !== null;
        const hasEnd = r.end_surah_number !== undefined && r.end_surah_number !== null;
        
        if (hasStart && hasEnd && r.start_surah_number !== r.end_surah_number) {
          const start = Math.min(r.start_surah_number as number, r.end_surah_number as number);
          const end = Math.max(r.start_surah_number as number, r.end_surah_number as number);
          // For display, we might want to show the clipped range if it was outside 1-114
          const displayStart = Math.max(1, start);
          const displayEnd = Math.min(114, end);
          return `Revised Range: Surahs ${displayStart}-${displayEnd}`;
        }
        return `Revised Ayahs: ${r.start_ayah || 1}-${r.end_ayah || surah.ayah_count}`;
      });
      
      const uniqueDetails = Array.from(new Set(detailsList));
      details = `In Revision: ${uniqueDetails.join(', ')}`;
    }

    return {
      number: sNum,
      name: surah.name,
      ayahCount: surah.ayah_count,
      status,
      details
    };
  });
};
