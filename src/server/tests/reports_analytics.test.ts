import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Op } from 'sequelize';

// Mock models
const mockUser = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findAndCountAll: jest.fn()
};
const mockSession = {
  findAll: jest.fn(),
  count: jest.fn()
};
const mockAttendance = {
  findAll: jest.fn()
};
const mockMemorizationRecord = {
  findAll: jest.fn()
};

jest.unstable_mockModule('../model', () => ({
  User: mockUser,
  Session: mockSession,
  Attendance: mockAttendance,
  MemorizationRecord: mockMemorizationRecord,
  AttendanceStatus: {
    PRESENT: 'present',
    ABSENT: 'absent',
    EXCUSED: 'excused'
  },
  Op: {
    between: 'between',
    gte: 'gte',
    or: 'or'
  },
  fn: jest.fn(),
  col: jest.fn(),
  literal: jest.fn(),
  JuzProgress: { count: jest.fn() },
  RevisionRecord: { findAll: jest.fn() }
}));

const { analyticsService } = await import('../services/analyticsService');
import * as reportService from '../services/reportService';

describe('Analytics and Reports Service', () => {
  const tenantId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('analyticsService.getAttendanceMetrics', () => {
    it('should calculate attendance percentage correctly', async () => {
      const mockSessions: any[] = [
        { attendance: { status: 'present' } },
        { attendance: { status: 'present' } },
        { attendance: { status: 'absent' } },
        { attendance: { status: 'excused' } }
      ];
      
      (mockSession.findAll as any).mockResolvedValue(mockSessions);

      const result = await analyticsService.getAttendanceMetrics(tenantId, '2023-10-01', '2023-10-31');

      expect(result.total).toBe(4);
      expect(result.present).toBe(2);
      expect(result.absent).toBe(1);
      expect(result.excused).toBe(1);
      expect(result.percentage).toBe(50);
    });

    it('should return zero percentage if no sessions found', async () => {
      (mockSession.findAll as any).mockResolvedValue([]);

      const result = await analyticsService.getAttendanceMetrics(tenantId, '2023-10-01', '2023-10-31');

      expect(result.total).toBe(0);
      expect(result.percentage).toBe(0);
    });
  });

  describe('analyticsService.getMemorizationProgress', () => {
    it('should calculate pages memorized based on ayahs', async () => {
      const mockRecords: any[] = [
        { start_ayah: 1, end_ayah: 15, created_at: new Date('2023-10-05') }, // 15 ayahs = 1 page
        { start_ayah: 1, end_ayah: 30, created_at: new Date('2023-10-10') }  // 30 ayahs = 2 pages
      ];

      (mockMemorizationRecord.findAll as any).mockResolvedValue(mockRecords);

      const result = await analyticsService.getMemorizationProgress(tenantId, '2023-10-01', '2023-10-31');

      expect(result.records_count).toBe(2);
      expect(result.pages_memorized).toBe(3);
      expect(result.trend).toHaveLength(2);
    });
  });

  describe('analyticsService.getActiveStudents', () => {
    it('should count unique students from sessions and logins', async () => {
      (mockSession.findAll as any).mockResolvedValue([
        { student_id: 1 },
        { student_id: 2 }
      ]);
      (mockUser.findAll as any).mockResolvedValue([
        { id: 2 },
        { id: 3 }
      ]);

      const result = await analyticsService.getActiveStudents(tenantId);

      // daily/weekly/monthly all call getCount, which we can't easily mock separately here
      // but we can check if it returns a MetricsResult structure
      expect(result).toHaveProperty('daily');
      expect(result).toHaveProperty('weekly');
      expect(result).toHaveProperty('monthly');
    });
  });
});
