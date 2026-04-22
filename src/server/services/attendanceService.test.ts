import { jest, describe, it, expect, beforeAll, afterAll } from '@jest/globals';

const mockAttendance = {
  create: jest.fn()
};
const mockSession = {
  findAll: jest.fn()
};

jest.unstable_mockModule('../model', () => ({
  Attendance: mockAttendance,
  Session: mockSession,
  Op: {
    between: Symbol('between')
  },
  AttendanceStatus: {
    PRESENT: 'present',
    ABSENT: 'absent'
  }
}));

const { getAttendanceTrends } = await import('./attendanceService');
const { Session } = await import('../model') as any;

describe('attendanceService.getAttendanceTrends', () => {
  const tenantId = 1;
  const mockDate = new Date('2024-03-28T12:00:00Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(mockDate);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('should return aggregated weekly attendance trends for 8 weeks', async () => {
    // Mock 8 weeks of data
    // For simplicity, we'll return 1 session per week with 1 attendance record (PRESENT)
    (Session.findAll as jest.Mock).mockResolvedValue([{
      attendance: { status: 'present' }
    }]);

    const result = await getAttendanceTrends(tenantId);

    expect(result.trends).toHaveLength(8);
    expect(result.currentAverage).toBe(100);
    expect(result.trends[0].week).toBe('W1'); // W1 is the oldest in our loop
    expect(result.trends[7].week).toBe('W8'); // W8 is the most recent
    expect(Session.findAll).toHaveBeenCalledTimes(8);
  });

  it('should handle missing data for weeks gracefully', async () => {
    (Session.findAll as jest.Mock).mockResolvedValue([]);

    const result = await getAttendanceTrends(tenantId);

    expect(result.trends).toHaveLength(8);
    expect(result.trends.every(t => t.value === 0)).toBe(true);
    expect(result.currentAverage).toBe(0);
  });
});
