import logger from '../utils/logger';
import School from '../model/School';
import Session from '../model/Session';
import { Op } from 'sequelize';
import { RecordType } from '../model/MemorizationRecord';
import MemorizationRecord from '../model/MemorizationRecord';
import RevisionRecord from '../model/RevisionRecord';
import {
  CANONICAL_SESSION_TYPES,
  CANONICAL_SESSION_TYPE_LABELS,
  DATE_OUTSIDE_SCHOOL_CALENDAR_ERROR_CODE,
  INVALID_DATE_FORMAT_ERROR_CODE,
  INVALID_SESSION_DAY_ERROR_CODE,
  MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE,
  SCHEDULE_OVERLAP_ERROR_CODE,
  SCHEDULE_VALIDATION_ERROR_CODE,
} from '../constants';

export type SessionType = 'revision' | 'memorization:default' | string;

export interface ScheduleValidationResult {
  isValid: boolean;
  error?: string;
  code?: string;
  details?: {
    sessionType?: SessionType;
    recordingDate?: string;
    allowedDays?: number[];
    conflictingType?: string;
    overlappingDays?: number[];
    affectedSessionCount?: number;
    affectedDates?: string[];
  };
}

type NormalizedSchedulePayload = {
  schedule_mode?: 'simple' | 'advanced';
  study_days?: number[];
  session_type_day_map?: Record<string, number[]> | null;
  enabled_memorization_subtypes?: Array<{ key: string; label: string; active: boolean }> | null;
};

type ConflictCacheEntry = {
  expiresAt: number;
  result: {
    hasMemorizationOnDate: boolean;
    hasRevisionOnDate: boolean;
  };
};

const CONFLICT_CACHE_TTL_MS = 60 * 1000;
const conflictCache = new Map<string, ConflictCacheEntry>();

/**
 * Service to handle school scheduling logic, including advanced mode resolution
 * and date validation.
 */
export class ScheduleService {
  public static validateSchedule(
    school: School,
    sessionType: SessionType,
    recordingDate: string,
    logId: string
  ): ScheduleValidationResult {
    try {
      if (!this.isDateStringValid(recordingDate)) {
        return {
          isValid: false,
          error: 'Invalid date format provided.',
          code: INVALID_DATE_FORMAT_ERROR_CODE,
        };
      }

      const allowedDays = this.getAllowedDays(school, sessionType);
      const dayOfWeek = this.getUtcDayOfWeek(recordingDate);

      if (dayOfWeek === null) {
        return {
          isValid: false,
          error: 'Invalid date format provided.',
          code: INVALID_DATE_FORMAT_ERROR_CODE,
        };
      }

      if (!allowedDays.includes(dayOfWeek)) {
        const typeLabel = this.getSessionTypeLabel(sessionType);
        return {
          isValid: false,
          error: `The selected date is not available for ${typeLabel} sessions.`,
          code: INVALID_SESSION_DAY_ERROR_CODE,
          details: {
            sessionType,
            recordingDate,
            allowedDays,
          },
        };
      }

      return { isValid: true };
    } catch (error: any) {
      logger.error(`[${logId}] Schedule validation failed: ${error.message}`, { stack: error.stack });
      return {
        isValid: false,
        error: 'An error occurred while validating the schedule.',
        code: SCHEDULE_VALIDATION_ERROR_CODE,
      };
    }
  }

  public static validateSchoolCalendarDate(
    school: School,
    recordingDate: string,
    logId: string
  ): ScheduleValidationResult {
    try {
      if (!this.isDateStringValid(recordingDate)) {
        return {
          isValid: false,
          error: 'Invalid date format provided.',
          code: INVALID_DATE_FORMAT_ERROR_CODE,
        };
      }

      const allowedDays = this.getSchoolOperatingDays(school);
      const dayOfWeek = this.getUtcDayOfWeek(recordingDate);

      if (dayOfWeek === null) {
        return {
          isValid: false,
          error: 'Invalid date format provided.',
          code: INVALID_DATE_FORMAT_ERROR_CODE,
        };
      }

      if (!allowedDays.includes(dayOfWeek)) {
        return {
          isValid: false,
          error: 'The selected date is not within the school operating calendar.',
          code: DATE_OUTSIDE_SCHOOL_CALENDAR_ERROR_CODE,
          details: {
            recordingDate,
            allowedDays,
          },
        };
      }

      return { isValid: true };
    } catch (error: any) {
      logger.error(`[${logId}] School calendar validation failed: ${error.message}`, { stack: error.stack });
      return {
        isValid: false,
        error: 'An error occurred while validating the school calendar.',
        code: SCHEDULE_VALIDATION_ERROR_CODE,
      };
    }
  }

  public static async validateMutualExclusivity(
    school: School,
    sessionType: SessionType,
    recordingDate: string,
    tenantId: number,
    studentId: number,
    logId: string
  ): Promise<ScheduleValidationResult> {
    try {
      if (!this.isDateStringValid(recordingDate)) {
        return {
          isValid: false,
          error: 'Invalid date format provided.',
          code: INVALID_DATE_FORMAT_ERROR_CODE,
        };
      }

      if (!this.shouldEnforceMutualExclusivity(school)) {
        return { isValid: true };
      }

      const oppositeType = this.getOppositeSessionType(sessionType);
      if (!oppositeType) {
        return { isValid: true };
      }

      const conflictSnapshot = await this.getDateConflictSnapshot(tenantId, studentId, recordingDate);
      const hasConflict =
        oppositeType === CANONICAL_SESSION_TYPES.REVISION
          ? conflictSnapshot.hasRevisionOnDate
          : conflictSnapshot.hasMemorizationOnDate;

      if (!hasConflict) {
        return { isValid: true };
      }

      logger.warn(
        `[${logId}] Mutual exclusivity violation blocked for tenantId=${tenantId} studentId=${studentId} sessionType=${sessionType} recordingDate=${recordingDate} conflictingType=${oppositeType}`
      );

      return {
        isValid: false,
        error: `This date already has a ${this.getSessionTypeLabel(oppositeType)} session. ${this.getSessionTypeLabel(sessionType)} cannot be recorded on the same day in advanced mode.`,
        code: MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE,
        details: {
          sessionType,
          recordingDate,
          conflictingType: oppositeType,
        },
      };
    } catch (error: any) {
      logger.error(
        `[${logId}] Mutual exclusivity validation failed for tenantId=${tenantId} studentId=${studentId} recordingDate=${recordingDate}: ${error.message}`,
        { stack: error.stack }
      );
      return {
        isValid: false,
        error: 'An error occurred while validating session conflicts.',
        code: SCHEDULE_VALIDATION_ERROR_CODE,
      };
    }
  }

  public static async validateFullScheduleCompliance(
    school: School,
    sessionType: SessionType,
    recordingDate: string,
    tenantId: number,
    studentId: number,
    logId: string
  ): Promise<ScheduleValidationResult> {
    const calendarValidation = this.validateSchoolCalendarDate(school, recordingDate, logId);
    if (!calendarValidation.isValid) {
      return calendarValidation;
    }

    const scheduleValidation = this.validateSchedule(school, sessionType, recordingDate, logId);
    if (!scheduleValidation.isValid) {
      return scheduleValidation;
    }

    return this.validateMutualExclusivity(school, sessionType, recordingDate, tenantId, studentId, logId);
  }

  public static validateNoDayOverlap(
    sessionTypeDayMap: Record<string, number[]> | null | undefined
  ): { isValid: boolean; overlappingDays?: number[]; error?: string } {
    if (!sessionTypeDayMap) {
      return { isValid: true };
    }

    const memDays = this.normalizeDayList(sessionTypeDayMap[CANONICAL_SESSION_TYPES.MEMORIZATION_DEFAULT] || []);
    const revDays = this.normalizeDayList(sessionTypeDayMap[CANONICAL_SESSION_TYPES.REVISION] || []);
    const overlappingDays = memDays.filter((day) => revDays.includes(day));

    if (overlappingDays.length > 0) {
      return {
        isValid: false,
        overlappingDays,
        error: 'Memorization and Revision days cannot overlap in advanced scheduling mode.',
      };
    }

    return { isValid: true };
  }

  public static async detectRetroactiveConflicts(
    school: School,
    proposedSchedule: {
      schedule_mode?: 'simple' | 'advanced';
      study_days?: number[];
      session_type_day_map?: Record<string, number[]> | null;
    },
    tenantId: number,
    logId: string
  ): Promise<{ affectedSessionCount: number; affectedDates: string[] }> {
    try {
      const scheduleCandidate = {
        ...school.get({ plain: true }),
        ...proposedSchedule,
      } as School;
      const today = new Date().toISOString().slice(0, 10);

      const sessions = await Session.findAll({
        where: {
          tenant_id: tenantId,
          session_date: {
            [Op.gte]: today,
          },
        },
        include: [
          {
            model: MemorizationRecord,
            as: 'memorization_records',
            required: false,
            where: { deleted_at: null, record_type: RecordType.MEMORIZED } as any,
          },
          {
            model: RevisionRecord,
            as: 'revision_records',
            required: false,
            where: { deleted_at: null } as any,
          },
        ],
      });

      const affectedDates = new Set<string>();

      for (const session of sessions) {
        const sessionDate = session.session_date;
        const memorizationRecords = (session as any).memorization_records || [];
        const revisionRecords = (session as any).revision_records || [];

        if (memorizationRecords.length > 0) {
          const validation = this.validateSchedule(scheduleCandidate, CANONICAL_SESSION_TYPES.MEMORIZATION_DEFAULT, sessionDate, logId);
          if (!validation.isValid) {
            affectedDates.add(sessionDate);
            continue;
          }
        }

        if (revisionRecords.length > 0) {
          const validation = this.validateSchedule(scheduleCandidate, CANONICAL_SESSION_TYPES.REVISION, sessionDate, logId);
          if (!validation.isValid) {
            affectedDates.add(sessionDate);
          }
        }
      }

      return {
        affectedSessionCount: affectedDates.size,
        affectedDates: Array.from(affectedDates).sort(),
      };
    } catch (error: any) {
      logger.error(`[${logId}] Failed to detect retroactive conflicts for tenantId=${tenantId}: ${error.message}`, {
        stack: error.stack,
      });
      return {
        affectedSessionCount: 0,
        affectedDates: [],
      };
    }
  }

  public static normalizeScheduleInput(input: {
    scheduleMode?: 'simple' | 'advanced';
    studyDays?: number[];
    sessionTypeDayMap?: Record<string, number[]> | null;
    enabledMemorizationSubtypes?: Array<{ key: string; label: string; active: boolean }> | null;
  }): NormalizedSchedulePayload {
    const normalized: NormalizedSchedulePayload = {};

    if (input.scheduleMode !== undefined) {
      if (!['simple', 'advanced'].includes(input.scheduleMode)) {
        throw new Error('Schedule mode must be either simple or advanced.');
      }
      normalized.schedule_mode = input.scheduleMode;
    }

    if (input.studyDays !== undefined) {
      normalized.study_days = this.normalizeDayList(input.studyDays, true);
    }

    if (input.sessionTypeDayMap !== undefined) {
      normalized.session_type_day_map = this.normalizeSessionTypeDayMap(input.sessionTypeDayMap);
    }

    if (input.enabledMemorizationSubtypes !== undefined) {
      normalized.enabled_memorization_subtypes = Array.isArray(input.enabledMemorizationSubtypes)
        ? input.enabledMemorizationSubtypes
            .filter((item) => item && typeof item.key === 'string' && typeof item.label === 'string')
            .map((item) => ({
              key: item.key.trim(),
              label: item.label.trim(),
              active: Boolean(item.active),
            }))
        : [];
    }

    return normalized;
  }

  public static validateScheduleConfiguration(
    schedule: Pick<NormalizedSchedulePayload, 'schedule_mode' | 'study_days' | 'session_type_day_map'>
  ): ScheduleValidationResult {
    if (schedule.schedule_mode === 'advanced' && schedule.session_type_day_map) {
      const overlapCheck = this.validateNoDayOverlap(schedule.session_type_day_map);
      if (!overlapCheck.isValid) {
        return {
          isValid: false,
          error: overlapCheck.error,
          code: SCHEDULE_OVERLAP_ERROR_CODE,
          details: {
            overlappingDays: overlapCheck.overlappingDays,
          },
        };
      }
    }

    return { isValid: true };
  }

  public static getScheduleValidationMetadata(school: School) {
    const overlapCheck = this.validateNoDayOverlap(school.session_type_day_map);
    return {
      isAdvancedMode: school.schedule_mode === 'advanced',
      hasOverlap: !overlapCheck.isValid,
      overlappingDays: overlapCheck.overlappingDays || [],
      operatingDays: this.getSchoolOperatingDays(school),
    };
  }

  public static getAllowedDays(school: School, sessionType: SessionType): number[] {
    const { schedule_mode, session_type_day_map, study_days } = school;

    if (schedule_mode === 'advanced' && session_type_day_map) {
      const typeSpecificDays = session_type_day_map[sessionType];
      if (Array.isArray(typeSpecificDays) && typeSpecificDays.length > 0) {
        return this.normalizeDayList(typeSpecificDays);
      }
    }

    return this.normalizeDayList(study_days || []);
  }

  public static async getDateConflictSnapshot(
    tenantId: number,
    studentId: number,
    recordingDate: string
  ): Promise<{ hasMemorizationOnDate: boolean; hasRevisionOnDate: boolean }> {
    const cacheKey = `${tenantId}:${studentId}:${recordingDate}`;
    const cached = conflictCache.get(cacheKey);
    const now = Date.now();

    if (cached && cached.expiresAt > now) {
      return cached.result;
    }

    const [hasMemorizationOnDate, hasRevisionOnDate] = await Promise.all([
      this.hasSessionTypeOnDate(tenantId, studentId, recordingDate, CANONICAL_SESSION_TYPES.MEMORIZATION_DEFAULT),
      this.hasSessionTypeOnDate(tenantId, studentId, recordingDate, CANONICAL_SESSION_TYPES.REVISION),
    ]);

    const result = { hasMemorizationOnDate, hasRevisionOnDate };
    conflictCache.set(cacheKey, {
      expiresAt: now + CONFLICT_CACHE_TTL_MS,
      result,
    });

    return result;
  }

  public static invalidateConflictCache(tenantId: number, studentId: number, recordingDate: string) {
    conflictCache.delete(`${tenantId}:${studentId}:${recordingDate}`);
  }

  public static validateDateFormat(recordingDate: string): ScheduleValidationResult {
    if (!this.isDateStringValid(recordingDate)) {
      return {
        isValid: false,
        error: 'Invalid date format provided.',
        code: INVALID_DATE_FORMAT_ERROR_CODE,
      };
    }

    return { isValid: true };
  }

  private static async hasSessionTypeOnDate(
    tenantId: number,
    studentId: number,
    recordingDate: string,
    sessionType: SessionType
  ): Promise<boolean> {
    const include =
      sessionType === CANONICAL_SESSION_TYPES.REVISION
        ? [
            {
              model: RevisionRecord,
              as: 'revision_records',
              required: true,
              where: { deleted_at: null } as any,
            },
          ]
        : [
            {
              model: MemorizationRecord,
              as: 'memorization_records',
              required: true,
              where: {
                deleted_at: null,
                record_type: RecordType.MEMORIZED,
              } as any,
            },
          ];

    const existingSession = await Session.findOne({
      where: {
        tenant_id: tenantId,
        student_id: studentId,
        session_date: recordingDate,
        deleted_at: null,
      } as any,
      include,
    });

    return Boolean(existingSession);
  }

  private static shouldEnforceMutualExclusivity(school: School): boolean {
    if (school.schedule_mode !== 'advanced' || !school.session_type_day_map) {
      return false;
    }

    const memDays = school.session_type_day_map[CANONICAL_SESSION_TYPES.MEMORIZATION_DEFAULT];
    const revDays = school.session_type_day_map[CANONICAL_SESSION_TYPES.REVISION];

    return Array.isArray(memDays) && memDays.length > 0 && Array.isArray(revDays) && revDays.length > 0;
  }

  private static getOppositeSessionType(sessionType: SessionType): SessionType | null {
    if (sessionType === CANONICAL_SESSION_TYPES.REVISION) {
      return CANONICAL_SESSION_TYPES.MEMORIZATION_DEFAULT;
    }

    if (sessionType.startsWith('memorization')) {
      return CANONICAL_SESSION_TYPES.REVISION;
    }

    return null;
  }

  private static getSchoolOperatingDays(school: School): number[] {
    if (school.schedule_mode === 'advanced' && school.session_type_day_map) {
      const union = new Set<number>(this.normalizeDayList(school.study_days || []));
      Object.values(school.session_type_day_map).forEach((days) => {
        this.normalizeDayList(days || []).forEach((day) => union.add(day));
      });
      return Array.from(union).sort((a, b) => a - b);
    }

    return this.normalizeDayList(school.study_days || []);
  }

  private static normalizeSessionTypeDayMap(
    sessionTypeDayMap: Record<string, number[]> | null | undefined
  ): Record<string, number[]> | null {
    if (sessionTypeDayMap === null) {
      return null;
    }

    if (sessionTypeDayMap === undefined) {
      return undefined as never;
    }

    if (typeof sessionTypeDayMap !== 'object' || Array.isArray(sessionTypeDayMap)) {
      throw new Error('Session type day map must be an object.');
    }

    const normalizedMap: Record<string, number[]> = {};
    for (const [key, value] of Object.entries(sessionTypeDayMap)) {
      normalizedMap[key] = this.normalizeDayList(value || [], true);
    }

    return normalizedMap;
  }

  private static normalizeDayList(days: number[], strict = false): number[] {
    if (!Array.isArray(days)) {
      if (strict) {
        throw new Error('Schedule days must be an array of integers between 0 and 6.');
      }
      return [];
    }

    const normalized = days.map((day) => Number(day));
    const invalidDays = normalized.filter((day) => !Number.isInteger(day) || day < 0 || day > 6);
    const hasDuplicates = new Set(normalized).size !== normalized.length;

    if (strict && (invalidDays.length > 0 || hasDuplicates)) {
      throw new Error('Schedule days must contain unique integers between 0 and 6.');
    }

    return [...new Set(normalized.filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))].sort((a, b) => a - b);
  }

  private static isDateStringValid(recordingDate: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(recordingDate) && this.getUtcDayOfWeek(recordingDate) !== null;
  }

  private static getUtcDayOfWeek(recordingDate: string): number | null {
    const date = new Date(`${recordingDate}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return date.getUTCDay();
  }

  private static getSessionTypeLabel(sessionType: SessionType): string {
    return CANONICAL_SESSION_TYPE_LABELS[sessionType] || sessionType;
  }
}

export default ScheduleService;
