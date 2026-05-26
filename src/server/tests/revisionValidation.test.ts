import { validateRevisionRecord, RevisionValidationInput } from '../utils/revisionValidation';

const TEST_SURAHS = [
  { number: 1, name: 'Al-Fatihah', ayah_count: 7 },
  { number: 2, name: 'Al-Baqarah', ayah_count: 286 },
  { number: 3, name: 'Ali-Imran', ayah_count: 200 },
  { number: 112, name: 'Al-Ikhlas', ayah_count: 4 },
  { number: 113, name: 'Al-Falaq', ayah_count: 5 },
  { number: 114, name: 'An-Nas', ayah_count: 6 },
];

const mockGetSurahByNumber = async (num: number) => {
  return TEST_SURAHS.find(s => s.number === num) || null;
};

describe('validateRevisionRecord', () => {
  describe('single surah revision', () => {
    it('should validate valid same-surah ayah range', async () => {
      const input: RevisionValidationInput = { surahNumber: 1, startAyah: 1, endAyah: 7 };
      const result = await validateRevisionRecord(input, mockGetSurahByNumber);
      expect(result.isValid).toBe(true);
    });

    it('should reject when end ayah exceeds surah count', async () => {
      const input: RevisionValidationInput = { surahNumber: 1, startAyah: 1, endAyah: 10 };
      const result = await validateRevisionRecord(input, mockGetSurahByNumber);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('total ayahs in Al-Fatihah');
    });

    it('should reject when start ayah > end ayah', async () => {
      const input: RevisionValidationInput = { surahNumber: 2, startAyah: 5, endAyah: 3 };
      const result = await validateRevisionRecord(input, mockGetSurahByNumber);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('start cannot be greater than end');
    });
  });

  describe('surah range revision', () => {
    it('should validate valid cross-surah range', async () => {
      const input: RevisionValidationInput = { startSurahNumber: 1, endSurahNumber: 2, startAyah: 1, endAyah: 286 };
      const result = await validateRevisionRecord(input, mockGetSurahByNumber);
      expect(result.isValid).toBe(true);
    });

    it('should reject when start ayah exceeds start surah count', async () => {
      const input: RevisionValidationInput = { startSurahNumber: 1, endSurahNumber: 2, startAyah: 10, endAyah: 100 };
      const result = await validateRevisionRecord(input, mockGetSurahByNumber);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('start ayah');
    });

    it('should reject when end ayah exceeds end surah count', async () => {
      const input: RevisionValidationInput = { startSurahNumber: 1, endSurahNumber: 2, startAyah: 1, endAyah: 300 };
      const result = await validateRevisionRecord(input, mockGetSurahByNumber);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('end ayah');
    });

    it('should treat same surah range as single surah', async () => {
      const input: RevisionValidationInput = { startSurahNumber: 1, endSurahNumber: 1, startAyah: 1, endAyah: 7 };
      const result = await validateRevisionRecord(input, mockGetSurahByNumber);
      expect(result.isValid).toBe(true);
    });

    it('should prioritize surah range when both surahNumber and range fields are present', async () => {
      // Scenario: Surah 113 (5 ayahs) to 114 (6 ayahs), end ayah is 6.
      // If single surah (113) is prioritized, it fails because 6 > 5.
      // If range is prioritized, it passes because 6 is valid for Surah 114.
      const input: RevisionValidationInput = {
        surahNumber: 113,
        startSurahNumber: 113,
        endSurahNumber: 114,
        startAyah: 1,
        endAyah: 6
      };
      const result = await validateRevisionRecord(input, mockGetSurahByNumber);
      expect(result.isValid).toBe(true);
    });
  });

  describe('page range revision', () => {
    it('should validate valid page range', async () => {
      const input: RevisionValidationInput = { startPage: 1, endPage: 20 };
      const result = await validateRevisionRecord(input, mockGetSurahByNumber);
      expect(result.isValid).toBe(true);
    });

    it('should reject when start page > end page', async () => {
      const input: RevisionValidationInput = { startPage: 20, endPage: 1 };
      const result = await validateRevisionRecord(input, mockGetSurahByNumber);
      expect(result.isValid).toBe(false);
    });

    it('should reject missing start page', async () => {
      const input: RevisionValidationInput = { endPage: 20 };
      const result = await validateRevisionRecord(input, mockGetSurahByNumber);
      expect(result.isValid).toBe(false);
    });
  });
});
