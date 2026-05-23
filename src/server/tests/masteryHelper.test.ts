import { calculateMasteryData, MasterySurah, MemorizationRecordMinimal, RevisionRecordMinimal } from '../utils/masteryHelper';

describe('calculateMasteryData', () => {
  const mockSurahs: MasterySurah[] = [
    { number: 1, name: 'Al-Fatihah', ayah_count: 7 },
    { number: 2, name: 'Al-Baqarah', ayah_count: 286 },
    { number: 3, name: 'Aal-E-Imran', ayah_count: 200 },
    { number: 4, name: 'An-Nisa', ayah_count: 176 },
    { number: 5, name: 'Al-Ma’idah', ayah_count: 120 },
  ];

  it('should handle single-surah revisions correctly', () => {
    const memRecords: MemorizationRecordMinimal[] = [];
    const revRecords: RevisionRecordMinimal[] = [
      { surah_number: 1, start_ayah: 1, end_ayah: 7 }
    ];

    const result = calculateMasteryData(mockSurahs, memRecords, revRecords);
    
    expect(result[0].status).toBe(2);
    expect(result[0].details).toContain('In Revision: Revised Ayahs: 1-7');
    expect(result[1].status).toBe(0);
  });

  it('should handle multi-surah revisions spanning consecutive surahs', () => {
    const memRecords: MemorizationRecordMinimal[] = [];
    const revRecords: RevisionRecordMinimal[] = [
      { start_surah_number: 1, end_surah_number: 3 }
    ];

    const result = calculateMasteryData(mockSurahs, memRecords, revRecords);
    
    expect(result[0].status).toBe(2);
    expect(result[0].details).toContain('Revised Range: Surahs 1-3');
    expect(result[1].status).toBe(2);
    expect(result[1].details).toContain('Revised Range: Surahs 1-3');
    expect(result[2].status).toBe(2);
    expect(result[2].details).toContain('Revised Range: Surahs 1-3');
    expect(result[3].status).toBe(0);
  });

  it('should handle invalid surah ranges (start > end) by swapping them', () => {
    const memRecords: MemorizationRecordMinimal[] = [];
    const revRecords: RevisionRecordMinimal[] = [
      { start_surah_number: 3, end_surah_number: 1 }
    ];

    const result = calculateMasteryData(mockSurahs, memRecords, revRecords);
    
    expect(result[0].status).toBe(2);
    expect(result[0].details).toContain('Revised Range: Surahs 1-3');
    expect(result[2].status).toBe(2);
  });

  it('should handle ranges outside 1-114 by clipping them', () => {
    const memRecords: MemorizationRecordMinimal[] = [];
    const revRecords: RevisionRecordMinimal[] = [
      { start_surah_number: 0, end_surah_number: 200 }
    ];

    const result = calculateMasteryData(mockSurahs, memRecords, revRecords);
    
    expect(result[0].status).toBe(2);
    expect(result[0].details).toContain('Revised Range: Surahs 1-114');
  });

  it('should handle partial surah range data by falling back to single surah display if surah_number is present', () => {
    const memRecords: MemorizationRecordMinimal[] = [];
    const revRecords: RevisionRecordMinimal[] = [
      { surah_number: 1, start_surah_number: 1, start_ayah: 1, end_ayah: 5 } // missing end_surah_number but has surah_number
    ];

    const result = calculateMasteryData(mockSurahs, memRecords, revRecords);
    expect(result[0].status).toBe(2);
    expect(result[0].details).toContain('In Revision: Revised Ayahs: 1-5');
  });

  it('should handle memorization status correctly', () => {
    const memRecords: MemorizationRecordMinimal[] = [
      { surah_number: 1, start_ayah: 1, end_ayah: 7 }
    ];
    const revRecords: RevisionRecordMinimal[] = [];

    const result = calculateMasteryData(mockSurahs, memRecords, revRecords);
    
    expect(result[0].status).toBe(1);
    expect(result[0].details).toBe('Fully Memorized (1-7)');
  });

  it('should prioritize revision status over memorization status', () => {
    const memRecords: MemorizationRecordMinimal[] = [
      { surah_number: 1, start_ayah: 1, end_ayah: 7 }
    ];
    const revRecords: RevisionRecordMinimal[] = [
      { surah_number: 1, start_ayah: 1, end_ayah: 7 }
    ];

    const result = calculateMasteryData(mockSurahs, memRecords, revRecords);
    
    expect(result[0].status).toBe(2);
  });
});
