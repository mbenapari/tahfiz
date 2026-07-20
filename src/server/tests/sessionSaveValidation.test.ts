import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import {
  CANONICAL_SESSION_TYPES,
  INVALID_SESSION_DAY_ERROR_CODE,
  MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE,
} from '../constants';

const mockGetSchoolById = jest.fn();
const mockCreateSession = jest.fn();
const mockCreateMemorizationRecord = jest.fn();
const mockCreateRevisionRecord = jest.fn();
const mockGetSurahByNumber = jest.fn();
const mockMarkAttendance = jest.fn();
const mockUpdateAggregatedProgress = jest.fn();
const mockValidateDateFormat = jest.fn();
const mockValidateFullScheduleCompliance = jest.fn();
const mockInvalidateConflictCache = jest.fn();

await jest.unstable_mockModule('../services/schoolService', () => ({
  getSchoolById: mockGetSchoolById,
}));

await jest.unstable_mockModule('../services/sessionService', () => ({
  createSession: mockCreateSession,
}));

await jest.unstable_mockModule('../services/memorizationService', () => ({
  createMemorizationRecord: mockCreateMemorizationRecord,
}));

await jest.unstable_mockModule('../services/revisionService', () => ({
  createRevisionRecord: mockCreateRevisionRecord,
}));

await jest.unstable_mockModule('../services/surahService', () => ({
  getSurahByNumber: mockGetSurahByNumber,
}));

await jest.unstable_mockModule('../services/attendanceService', () => ({
  markAttendance: mockMarkAttendance,
}));

await jest.unstable_mockModule('../services/progressService', () => ({
  updateAggregatedProgress: mockUpdateAggregatedProgress,
}));

await jest.unstable_mockModule('../services/scheduleService', () => ({
  ScheduleService: {
    validateDateFormat: mockValidateDateFormat,
    validateFullScheduleCompliance: mockValidateFullScheduleCompliance,
    invalidateConflictCache: mockInvalidateConflictCache,
  },
}));

const { saveDailySession } = await import('../controller/sessionController');

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('sessionController.saveDailySession', () => {
  const school = {
    id: 1,
    study_days: [1, 2, 3, 4, 5],
    schedule_mode: 'advanced',
    session_type_day_map: {
      'memorization:default': [1, 3, 5],
      revision: [2, 4],
    },
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();

    (mockGetSchoolById as any).mockResolvedValue(school);
    (mockCreateSession as any).mockResolvedValue({ id: 44 });
    (mockMarkAttendance as any).mockResolvedValue({});
    (mockCreateMemorizationRecord as any).mockResolvedValue({ id: 55 });
    (mockCreateRevisionRecord as any).mockResolvedValue({ id: 66 });
    (mockGetSurahByNumber as any).mockResolvedValue({
      number: 1,
      name: 'Al-Fatihah',
      ayah_count: 7,
    });
    (mockUpdateAggregatedProgress as any).mockResolvedValue(undefined);
    (mockValidateDateFormat as any).mockReturnValue({ isValid: true });
    (mockInvalidateConflictCache as any).mockReturnValue(undefined);
  });

  it('returns 201 for a valid Hifz save', async () => {
    (mockValidateFullScheduleCompliance as any).mockResolvedValue({ isValid: true });

    const req: any = {
      correlationId: 'test-log',
      user: { tenantId: 1, id: 99 },
      body: {
        studentId: 12,
        sessionDate: '2026-06-22',
        recordingDate: '2026-06-22',
        attendance: { status: 'present' },
        hifzRecord: { surahNumber: 1, startAyah: 1, endAyah: 7 },
      },
    };
    const res = createMockRes();

    await saveDailySession(req, res);

    expect(mockValidateFullScheduleCompliance).toHaveBeenCalledWith(
      school,
      CANONICAL_SESSION_TYPES.MEMORIZATION_DEFAULT,
      '2026-06-22',
      1,
      12,
      'test-log'
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 201 for a valid Revision save', async () => {
    (mockValidateFullScheduleCompliance as any).mockResolvedValue({ isValid: true });

    const req: any = {
      correlationId: 'test-log',
      user: { tenantId: 1, id: 99 },
      body: {
        studentId: 12,
        sessionDate: '2026-06-24',
        recordingDate: '2026-06-24',
        attendance: { status: 'present' },
        revisionRecord: { startPage: 1, endPage: 5 },
      },
    };
    const res = createMockRes();

    await saveDailySession(req, res);

    expect(mockValidateFullScheduleCompliance).toHaveBeenCalledWith(
      school,
      CANONICAL_SESSION_TYPES.REVISION,
      '2026-06-24',
      1,
      12,
      'test-log'
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 400 when the selected date is outside the configured schedule', async () => {
    (mockValidateFullScheduleCompliance as any).mockResolvedValue({
      isValid: false,
      error: 'The selected date is not available for Hifz sessions.',
      code: INVALID_SESSION_DAY_ERROR_CODE,
    });

    const req: any = {
      correlationId: 'test-log',
      user: { tenantId: 1, id: 99 },
      body: {
        studentId: 12,
        sessionDate: '2026-06-21',
        recordingDate: '2026-06-21',
        attendance: { status: 'present' },
        hifzRecord: { surahNumber: 1, startAyah: 1, endAyah: 7 },
      },
    };
    const res = createMockRes();

    await saveDailySession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: INVALID_SESSION_DAY_ERROR_CODE,
      })
    );
  });

  it('returns 409 when a mutual exclusivity conflict exists for Hifz', async () => {
    (mockValidateFullScheduleCompliance as any).mockResolvedValue({
      isValid: false,
      error: 'Conflict',
      code: MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE,
    });

    const req: any = {
      correlationId: 'test-log',
      user: { tenantId: 1, id: 99 },
      body: {
        studentId: 12,
        sessionDate: '2026-06-22',
        recordingDate: '2026-06-22',
        attendance: { status: 'present' },
        hifzRecord: { surahNumber: 1, startAyah: 1, endAyah: 7 },
      },
    };
    const res = createMockRes();

    await saveDailySession(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE,
      })
    );
  });

  it('returns 400 when trying to save lesson records for an absent student', async () => {
    (mockValidateFullScheduleCompliance as any).mockResolvedValue({ isValid: true });

    const req: any = {
      correlationId: 'test-log',
      user: { tenantId: 1, id: 99 },
      body: {
        studentId: 12,
        sessionDate: '2026-06-22',
        recordingDate: '2026-06-22',
        attendance: { status: 'absent' },
        hifzRecord: { surahNumber: 1, startAyah: 1, endAyah: 7 },
      },
    };
    const res = createMockRes();

    await saveDailySession(req, res);

    expect(mockValidateFullScheduleCompliance).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 409 when both Hifz and Revision are submitted together in advanced mode', async () => {
    (mockValidateFullScheduleCompliance as any).mockResolvedValue({ isValid: true });

    const req: any = {
      correlationId: 'test-log',
      user: { tenantId: 1, id: 99 },
      body: {
        studentId: 12,
        sessionDate: '2026-06-22',
        recordingDate: '2026-06-22',
        attendance: { status: 'present' },
        hifzRecord: { surahNumber: 1, startAyah: 1, endAyah: 7 },
        revisionRecord: { startPage: 1, endPage: 5 },
      },
    };
    const res = createMockRes();

    await saveDailySession(req, res);

    expect(mockValidateFullScheduleCompliance).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(409);
  });
});
