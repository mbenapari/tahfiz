import {
  INVALID_DATE_FORMAT_ERROR_CODE,
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

/**
 * Service to handle school scheduling logic, including advanced mode resolution
 * and date validation.
 */
export class ScheduleService {
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

}

export default ScheduleService;
