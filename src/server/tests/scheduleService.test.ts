import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ScheduleService } from '../services/scheduleService';
import School from '../model/School';
import Session from '../model/Session';
import {
  CANONICAL_SESSION_TYPES,
  DATE_OUTSIDE_SCHOOL_CALENDAR_ERROR_CODE,
  INVALID_SESSION_DAY_ERROR_CODE,
  MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE,
} from '../constants';

describe('ScheduleService', () => {
  const mockSchool = {
    study_days: [1, 2, 3, 4, 5], // Mon-Fri
    schedule_mode: 'simple',
    session_type_day_map: null,
  } as unknown as School;

  const advancedSchool = {
    study_days: [1, 2, 3, 4, 5],
    schedule_mode: 'advanced',
    session_type_day_map: {
      'memorization:default': [1, 3, 5], // Mon, Wed, Fri
      'revision': [2, 4], // Tue, Thu
    },
  } as unknown as School;

  const advancedSchoolWithOverlap = {
    study_days: [1, 2, 3, 4, 5],
    schedule_mode: 'advanced',
    session_type_day_map: {
      'memorization:default': [1, 2],
      revision: [2, 4],
    },
  } as unknown as School;

  const advancedSchoolWithEmptyMap = {
    study_days: [1, 2, 3, 4, 5],
    schedule_mode: 'advanced',
    session_type_day_map: {},
  } as unknown as School;

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    ScheduleService.invalidateConflictCache(1, 100, '2026-06-22');
    ScheduleService.invalidateConflictCache(1, 100, '2026-06-23');
    ScheduleService.invalidateConflictCache(1, 101, '2026-06-24');
  });

  describe('validateSchedule', () => {
    it('should allow any study day in simple mode', () => {
      const monday = '2026-06-22'; // Monday
      const result = ScheduleService.validateSchedule(mockSchool, 'revision', monday, 'test');
      expect(result.isValid).toBe(true);
    });

    it('should reject non-study day in simple mode', () => {
      const sunday = '2026-06-21'; // Sunday
      const result = ScheduleService.validateSchedule(mockSchool, 'revision', sunday, 'test');
      expect(result.isValid).toBe(false);
      expect(result.code).toBe(INVALID_SESSION_DAY_ERROR_CODE);
    });

    it('should respect type-specific days in advanced mode (Hifz on Monday)', () => {
      const monday = '2026-06-22'; // Monday
      const result = ScheduleService.validateSchedule(advancedSchool, 'memorization:default', monday, 'test');
      expect(result.isValid).toBe(true);
    });

    it('should reject type-specific days in advanced mode (Revision on Monday)', () => {
      const monday = '2026-06-22'; // Monday
      const result = ScheduleService.validateSchedule(advancedSchool, 'revision', monday, 'test');
      expect(result.isValid).toBe(false);
      expect(result.details?.sessionType).toBe('revision');
    });

    it('should allow type-specific days in advanced mode (Revision on Tuesday)', () => {
      const tuesday = '2026-06-23'; // Tuesday
      const result = ScheduleService.validateSchedule(advancedSchool, 'revision', tuesday, 'test');
      expect(result.isValid).toBe(true);
    });

    it('should fallback to study_days in advanced mode if type is not in map', () => {
      const monday = '2026-06-22'; // Monday
      const result = ScheduleService.validateSchedule(advancedSchool, 'other_type', monday, 'test');
      expect(result.isValid).toBe(true);
    });
  });

  describe('normalizeScheduleInput', () => {
    it('should filter and sort study days', () => {
      const input = { studyDays: [5, 1, 3] };
      const result = ScheduleService.normalizeScheduleInput(input);
      expect(result.study_days).toEqual([1, 3, 5]);
    });

    it('should reject duplicate or invalid study days', () => {
      expect(() => ScheduleService.normalizeScheduleInput({ studyDays: [5, 1, 1, 9, 3] })).toThrow(
        'Schedule days must contain unique integers between 0 and 6.'
      );
    });

    it('should include new scheduling fields', () => {
      const input = { 
        scheduleMode: 'advanced' as const,
        sessionTypeDayMap: { 'hifz': [1] }
      };
      const result = ScheduleService.normalizeScheduleInput(input);
      expect(result.schedule_mode).toBe('advanced');
      expect(result.session_type_day_map).toEqual({ 'hifz': [1] });
    });
  });

  describe('validateNoDayOverlap', () => {
    it('returns valid when memorization and revision days are disjoint', () => {
      const result = ScheduleService.validateNoDayOverlap(advancedSchool.session_type_day_map);
      expect(result.isValid).toBe(true);
    });

    it('returns invalid with overlapping days when they intersect', () => {
      const result = ScheduleService.validateNoDayOverlap(advancedSchoolWithOverlap.session_type_day_map);
      expect(result.isValid).toBe(false);
      expect(result.overlappingDays).toEqual([2]);
    });

    it('handles empty arrays and missing entries gracefully', () => {
      expect(ScheduleService.validateNoDayOverlap({})).toEqual({ isValid: true });
      expect(
        ScheduleService.validateNoDayOverlap({
          'memorization:default': [],
          revision: [],
        })
      ).toEqual({ isValid: true });
    });
  });

  describe('validateSchoolCalendarDate', () => {
    it('rejects dates outside the school operating calendar', () => {
      const sunday = '2026-06-21';
      const result = ScheduleService.validateSchoolCalendarDate(mockSchool, sunday, 'test');
      expect(result.isValid).toBe(false);
      expect(result.code).toBe(DATE_OUTSIDE_SCHOOL_CALENDAR_ERROR_CODE);
    });

    it('allows dates inside the advanced-mode operating day union', () => {
      const thursday = '2026-06-25';
      const result = ScheduleService.validateSchoolCalendarDate(advancedSchool, thursday, 'test');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateMutualExclusivity', () => {
    it('allows Hifz on a date with no existing Revision for the same student', async () => {
      const spy = jest.spyOn(Session, 'findOne').mockResolvedValue(null as any);
      const result = await ScheduleService.validateMutualExclusivity(
        advancedSchool,
        CANONICAL_SESSION_TYPES.MEMORIZATION_DEFAULT,
        '2026-06-22',
        1,
        100,
        'test'
      );

      expect(result.isValid).toBe(true);
      expect(spy).toHaveBeenCalledTimes(2);
    });

    it('rejects Hifz when Revision already exists on the same date in advanced mode', async () => {
      jest
        .spyOn(Session, 'findOne')
        .mockResolvedValueOnce(null as any)
        .mockResolvedValueOnce({ id: 10 } as any);

      const result = await ScheduleService.validateMutualExclusivity(
        advancedSchool,
        CANONICAL_SESSION_TYPES.MEMORIZATION_DEFAULT,
        '2026-06-22',
        1,
        100,
        'test'
      );

      expect(result.isValid).toBe(false);
      expect(result.code).toBe(MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE);
      expect(result.details?.conflictingType).toBe(CANONICAL_SESSION_TYPES.REVISION);
    });

    it('rejects Revision when Hifz already exists on the same date in advanced mode', async () => {
      jest
        .spyOn(Session, 'findOne')
        .mockResolvedValueOnce({ id: 11 } as any)
        .mockResolvedValueOnce(null as any);

      const result = await ScheduleService.validateMutualExclusivity(
        advancedSchool,
        CANONICAL_SESSION_TYPES.REVISION,
        '2026-06-23',
        1,
        100,
        'test'
      );

      expect(result.isValid).toBe(false);
      expect(result.code).toBe(MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE);
      expect(result.details?.conflictingType).toBe(CANONICAL_SESSION_TYPES.MEMORIZATION_DEFAULT);
    });

    it('does not enforce mutual exclusivity in simple mode', async () => {
      const spy = jest.spyOn(Session, 'findOne').mockResolvedValue({ id: 10 } as any);
      const result = await ScheduleService.validateMutualExclusivity(
        mockSchool,
        CANONICAL_SESSION_TYPES.REVISION,
        '2026-06-22',
        1,
        100,
        'test'
      );

      expect(result.isValid).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it('does not enforce mutual exclusivity when the advanced map is empty', async () => {
      const spy = jest.spyOn(Session, 'findOne').mockResolvedValue({ id: 10 } as any);
      const result = await ScheduleService.validateMutualExclusivity(
        advancedSchoolWithEmptyMap,
        CANONICAL_SESSION_TYPES.REVISION,
        '2026-06-22',
        1,
        100,
        'test'
      );

      expect(result.isValid).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it('queries only non-deleted sessions and records', async () => {
      const spy = jest.spyOn(Session, 'findOne').mockResolvedValue(null as any);
      await ScheduleService.validateMutualExclusivity(
        advancedSchool,
        CANONICAL_SESSION_TYPES.REVISION,
        '2026-06-25',
        1,
        101,
        'test'
      );

      expect(spy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            deleted_at: null,
          }),
        })
      );
    });
  });

  describe('validateFullScheduleCompliance', () => {
    it('returns valid when schedule alignment and mutual exclusivity pass', async () => {
      jest.spyOn(Session, 'findOne').mockResolvedValue(null as any);
      const result = await ScheduleService.validateFullScheduleCompliance(
        advancedSchool,
        CANONICAL_SESSION_TYPES.MEMORIZATION_DEFAULT,
        '2026-06-22',
        1,
        100,
        'test'
      );

      expect(result.isValid).toBe(true);
    });

    it('returns school calendar error before mutual exclusivity check', async () => {
      const spy = jest.spyOn(Session, 'findOne').mockResolvedValue({ id: 10 } as any);
      const result = await ScheduleService.validateFullScheduleCompliance(
        advancedSchool,
        CANONICAL_SESSION_TYPES.REVISION,
        '2026-06-21',
        1,
        100,
        'test'
      );

      expect(result.isValid).toBe(false);
      expect(result.code).toBe(DATE_OUTSIDE_SCHOOL_CALENDAR_ERROR_CODE);
      expect(spy).not.toHaveBeenCalled();
    });

    it('returns mutual exclusivity error when schedule alignment passes but conflict exists', async () => {
      jest.spyOn(ScheduleService, 'validateMutualExclusivity').mockResolvedValue({
        isValid: false,
        error: 'Conflict',
        code: MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE,
      });

      const result = await ScheduleService.validateFullScheduleCompliance(
        advancedSchool,
        CANONICAL_SESSION_TYPES.REVISION,
        '2026-06-25',
        1,
        101,
        'test'
      );

      expect(result.isValid).toBe(false);
      expect(result.code).toBe(MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE);
    });
  });
});
