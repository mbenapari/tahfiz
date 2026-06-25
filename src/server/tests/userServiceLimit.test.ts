import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { UserRole } from '../model/User';

const mockUser = { findOne: jest.fn() };
const mockMemorizationRecord = { findAll: jest.fn() };
const mockRevisionRecord = { findAll: jest.fn() };
const mockSurah = { findAll: jest.fn() };
const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
const mockStatsService = {
  getStudentIndividualStats: jest.fn(),
};

jest.unstable_mockModule('../model', () => ({
  User: mockUser,
  Session: {},
  Attendance: {},
  MemorizationRecord: mockMemorizationRecord,
  RevisionRecord: mockRevisionRecord,
  Surah: mockSurah,
  School: {},
  JuzMap: {},
  SurahProgress: {},
  JuzProgress: {},
  Role: {},
  SchoolMember: {},
}));

jest.unstable_mockModule('../services/statsService', () => mockStatsService);
jest.unstable_mockModule('../utils/logger', () => ({ default: mockLogger }));

const { getStudentProfile } = await import('../services/userService');
const { User, MemorizationRecord, RevisionRecord, Surah } = await import('../model');
const statsService = await import('../services/statsService');

describe('userService.getStudentProfile', () => {
  const mockTenantId = 1;
  const mockStudentId = 100;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should apply the activityLimit to the number of sessions and activityLog', async () => {
    const limit = 5;
    
    const mockUser = {
      id: mockStudentId,
      tenant_id: mockTenantId,
      role: UserRole.STUDENT,
      toJSON: jest.fn().mockReturnValue({
        student_sessions: Array(10).fill({
          id: 1,
          session_date: new Date(),
          attendance: { status: 'present' },
          memorization_records: [],
          revision_records: []
        })
      })
    };

    (User.findOne as any).mockResolvedValue(mockUser);
    (Surah.findAll as any).mockResolvedValue([]);
    (MemorizationRecord.findAll as any).mockResolvedValue([]);
    (RevisionRecord.findAll as any).mockResolvedValue([]);
    (statsService.getStudentIndividualStats as any).mockResolvedValue({
      totalAyahsMemorized: 0,
      completionPercentage: 0,
      attendanceRate: 100
    });

    const result = await getStudentProfile(mockStudentId, mockTenantId, limit);

    // Verify User.findOne was called with the correct limit for sessions
    expect(User.findOne).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.arrayContaining([
        expect.objectContaining({
          as: 'student_sessions',
          limit: limit
        })
      ])
    }));

    // Verify activityLog is sliced to the limit
    expect(result.activityLog.length).toBeLessThanOrEqual(limit);
  });
});
