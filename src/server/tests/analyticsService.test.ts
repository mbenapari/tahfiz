import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Define the mock outside so it can be referenced
const mockSession = {
  findAll: jest.fn(),
  count: jest.fn(),
  sequelize: {
    fn: jest.fn(),
    col: jest.fn()
  }
};
const mockJuzProgress = {
  count: jest.fn()
};
const mockRevisionRecord = {
  findAll: jest.fn()
};

// Mock the models
jest.unstable_mockModule('../model', () => ({
  Session: mockSession,
  JuzProgress: mockJuzProgress,
  RevisionRecord: mockRevisionRecord,
  Op: {
    gte: Symbol('gte'),
    ne: Symbol('ne')
  }
}));

// Now import the service and models
const { analyticsService } = await import('../services/analyticsService');
const { Session, JuzProgress, RevisionRecord } = await import('../model') as any;

describe('analyticsService', () => {
  const tenantId = 1;
  const mockDate = new Date('2024-03-28T12:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('getActiveStudents', () => {
    it('should return daily, weekly, and monthly counts of active students', async () => {
      (Session.findAll as jest.Mock)
        .mockReset()
        .mockResolvedValueOnce([{ student_id: 1 }, { student_id: 2 }]) // daily
        .mockResolvedValueOnce([{ student_id: 1 }, { student_id: 2 }, { student_id: 3 }]) // weekly
        .mockResolvedValueOnce([{ student_id: 1 }, { student_id: 2 }, { student_id: 3 }, { student_id: 4 }]); // monthly

      const result = await analyticsService.getActiveStudents(tenantId);

      expect(result).toEqual({
        daily: 2,
        weekly: 3,
        monthly: 4
      });
    });

    it('should handle empty results gracefully', async () => {
      (Session.findAll as jest.Mock).mockReset().mockResolvedValue([]);

      const result = await analyticsService.getActiveStudents(tenantId);

      expect(result).toEqual({
        daily: 0,
        weekly: 0,
        monthly: 0
      });
    });
  });

  describe('getJuzCompleted', () => {
    it('should return daily, weekly, and monthly counts of completed Juz', async () => {
      (JuzProgress.count as jest.Mock)
        .mockReset()
        .mockResolvedValueOnce(5) // daily
        .mockResolvedValueOnce(15) // weekly
        .mockResolvedValueOnce(45); // monthly

      const result = await analyticsService.getJuzCompleted(tenantId);

      expect(result).toEqual({
        daily: 5,
        weekly: 15,
        monthly: 45
      });
    });
  });

  describe('getSessionsCount', () => {
    it('should return daily, weekly, and monthly session counts', async () => {
      (Session.count as jest.Mock)
        .mockReset()
        .mockResolvedValueOnce(10) // daily
        .mockResolvedValueOnce(50) // weekly
        .mockResolvedValueOnce(200); // monthly

      const result = await analyticsService.getSessionsCount(tenantId);

      expect(result).toEqual({
        daily: 10,
        weekly: 50,
        monthly: 200
      });
    });
  });

  describe('getJuzRevised', () => {
    it('should return daily, weekly, and monthly counts of revised Juz (proxy)', async () => {
      (RevisionRecord.findAll as jest.Mock)
        .mockReset()
        .mockResolvedValueOnce([{ surah_number: 1 }, { surah_number: 2 }]) // daily: 2 surahs -> 1 juz
        .mockResolvedValueOnce([{ surah_number: 1 }, { surah_number: 2 }, { surah_number: 3 }, { surah_number: 4 }]) // weekly: 4 surahs -> 2 juz
        .mockResolvedValueOnce(Array.from({ length: 9 }, (_, i) => ({ surah_number: i + 1 }))); // monthly: 9 surahs -> 3 juz

      const result = await analyticsService.getJuzRevised(tenantId);

      expect(result).toEqual({
        daily: 1,
        weekly: 2,
        monthly: 3
      });
    });
  });
});
