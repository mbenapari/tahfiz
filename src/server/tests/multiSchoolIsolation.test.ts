import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';
import { getTenantId, SchoolContextError } from '../utils/schoolContext';

// Use unstable_mockModule for ESM mocking
jest.unstable_mockModule('../services/statsService', () => ({
  getActiveStudentsCount: jest.fn(),
  getTotalHifzJuz: jest.fn(),
  getTodaySessionsStats: jest.fn(),
  getPendingReviewsCount: jest.fn(),
  getStudentIndividualStats: jest.fn(),
  getAttendanceTrends: jest.fn(),
}));

// The controller also imports these; mock them so no DB connection is created
jest.unstable_mockModule('../services/platformMetricsService', () => ({
  getPlatformMetrics: jest.fn(),
}));

jest.unstable_mockModule('../utils/logger', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn(), debug: jest.fn() },
}));

// Import after mocking
const statsController = await import('../controller/statsController');
const statsService: any = await import('../services/statsService');

describe('Multi-School Context Isolation Tests', () => {
  describe('getTenantId Utility', () => {
    it('should prioritize req.activeSchoolId (from header) over req.user.tenantId (from JWT)', () => {
      const req = {
        activeSchoolId: 101,
        user: { tenantId: 1 }
      } as any as Request;
      
      expect(getTenantId(req)).toBe(101);
    });

    it('should fallback to req.user.tenantId when activeSchoolId is missing', () => {
      const req = {
        user: { tenantId: 1 }
      } as any as Request;
      
      expect(getTenantId(req)).toBe(1);
    });

    it('should throw SchoolContextError when both are missing', () => {
      const req = {} as any as Request;
      
      expect(() => getTenantId(req)).toThrow(SchoolContextError);
    });
  });

  describe('Controller Isolation', () => {
    let mockRes: any;
    
    beforeEach(() => {
      mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      jest.clearAllMocks();
    });

    it('statsController.getActiveStudents should use the validated school context', async () => {
      const req = {
        activeSchoolId: 202,
        user: { tenantId: 1 }
      } as any as Request;

      const mockResult = { value: 50, trend: '+0%' };
      statsService.getActiveStudentsCount.mockResolvedValue(mockResult);

      await statsController.getActiveStudents(req, mockRes as Response);

      // Verify service was called with the CORRECT school ID (202), not the JWT ID (1)
      expect(statsService.getActiveStudentsCount).toHaveBeenCalledWith(202);
      expect(mockRes.json).toHaveBeenCalledWith(mockResult);
    });

    it('statsController.getActiveStudents should handle missing context error', async () => {
      const req = {} as any as Request;

      await statsController.getActiveStudents(req, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('No active school context')
      }));
    });
  });
});
