import { jest, describe, it, expect, beforeEach } from '@jest/globals';

const mockCreateSession = jest.fn();
const mockCreateMemorizationRecord = jest.fn();
const mockCreateRevisionRecord = jest.fn();
const mockGetSurahByNumber = jest.fn();
const mockMarkAttendance = jest.fn();
const mockUpdateAggregatedProgress = jest.fn();
const mockValidateDateFormat = jest.fn();
const mockCheckStudentEnrollment = jest.fn();

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

await jest.unstable_mockModule('../services/enrollmentService', () => ({
  checkStudentEnrollment: mockCheckStudentEnrollment,
}));

await jest.unstable_mockModule('../services/scheduleService', () => ({
  ScheduleService: {
    validateDateFormat: mockValidateDateFormat,
  },
}));

const { saveDailySession } = await import('../controller/sessionController');

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const buildReq = (overrides: Record<string, unknown>) =>
  ({
    correlationId: 'test-log',
    user: { tenantId: 1, userId: 99 },
    body: {
      studentId: 12,
      attendance: { status: 'present' },
      ...overrides,
    },
  }) as any;

describe('sessionController.saveDailySession', () => {
  beforeEach(() => {
    jest.clearAllMocks();

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
    (mockCheckStudentEnrollment as any).mockResolvedValue(true);
  });

  // 2026-06-21 is a Sunday, 2026-06-22 a Monday, 2026-06-27 a Saturday.
  it.each(['2026-06-21', '2026-06-22', '2026-06-27'])('returns 201 for a Hifz save on %s', async (date) => {
    const req = buildReq({
      sessionDate: date,
      recordingDate: date,
      hifzRecord: { surahNumber: 1, startAyah: 1, endAyah: 7 },
    });
    const res = createMockRes();

    await saveDailySession(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 201 for a Revision save on any day', async () => {
    const req = buildReq({
      sessionDate: '2026-06-21',
      recordingDate: '2026-06-21',
      revisionRecord: { startPage: 1, endPage: 5 },
    });
    const res = createMockRes();

    await saveDailySession(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 201 when Hifz and Revision are submitted together', async () => {
    const req = buildReq({
      sessionDate: '2026-06-22',
      recordingDate: '2026-06-22',
      hifzRecord: { surahNumber: 1, startAyah: 1, endAyah: 7 },
      revisionRecord: { startPage: 1, endPage: 5 },
    });
    const res = createMockRes();

    await saveDailySession(req, res);

    expect(mockCreateMemorizationRecord).toHaveBeenCalled();
    expect(mockCreateRevisionRecord).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 400 for an invalid date format', async () => {
    (mockValidateDateFormat as any).mockReturnValue({
      isValid: false,
      error: 'Invalid date format provided.',
      code: 'INVALID_DATE_FORMAT',
    });
    const req = buildReq({
      sessionDate: 'not-a-date',
      hifzRecord: { surahNumber: 1, startAyah: 1, endAyah: 7 },
    });
    const res = createMockRes();

    await saveDailySession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 400 when trying to save lesson records for an absent student', async () => {
    const req = buildReq({
      sessionDate: '2026-06-22',
      recordingDate: '2026-06-22',
      attendance: { status: 'absent' },
      hifzRecord: { surahNumber: 1, startAyah: 1, endAyah: 7 },
    });
    const res = createMockRes();

    await saveDailySession(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when the student is not enrolled in the school', async () => {
    (mockCheckStudentEnrollment as any).mockResolvedValue(false);
    const req = buildReq({ hifzRecord: { surahNumber: 1, startAyah: 1, endAyah: 7 } });
    const res = createMockRes();

    await saveDailySession(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(mockCreateSession).not.toHaveBeenCalled();
  });
});
