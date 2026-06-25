import { Request, Response } from 'express';
import * as schoolService from '../services/schoolService';
import { User } from '../model';
import * as jwtHelper from '../helper/jwtHelper';
import { ScheduleService } from '../services/scheduleService';
import logger from '../utils/logger';

const DAY_MAP: Record<string, number> = {
  SUN: 0,
  MON: 1,
  TUE: 2,
  WED: 3,
  THU: 4,
  FRI: 5,
  SAT: 6,
};

const mapStudyDaysToNumbers = (studyDays?: Array<string | number>) => {
  if (!studyDays) {
    return undefined;
  }

  return Array.isArray(studyDays)
    ? studyDays
        .map((day) => (typeof day === 'string' ? DAY_MAP[day.toUpperCase()] : day))
        .filter((day): day is number => day !== undefined)
    : [];
};

const createScheduleErrorResponse = (error: string, code: string, details?: Record<string, unknown>) => ({
  error,
  code,
  details,
});

export const createSchool = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const { schoolName, slug, timezone, studyDays, address, scheduleMode, sessionTypeDayMap, enabledMemorizationSubtypes } = req.body;

    if (!schoolName || !slug || !studyDays) {
      return res.status(400).json({ error: 'School name, slug, and study days are required' });
    }

    const studyDayNumbers = mapStudyDaysToNumbers(studyDays) || [];

    const normalizedSchedule = ScheduleService.normalizeScheduleInput({
      scheduleMode,
      studyDays: studyDayNumbers,
      sessionTypeDayMap,
      enabledMemorizationSubtypes
    });

    const scheduleValidation = ScheduleService.validateScheduleConfiguration(normalizedSchedule);
    if (!scheduleValidation.isValid) {
      logger.warn(
        `[${logId}] Schedule overlap rejected during school creation for slug=${slug} overlappingDays=${(scheduleValidation.details?.overlappingDays || []).join(',')}`
      );
      return res
        .status(400)
        .json(createScheduleErrorResponse(scheduleValidation.error || 'Invalid schedule configuration', scheduleValidation.code || 'SCHEDULE_OVERLAP', scheduleValidation.details));
    }

    const schoolData: schoolService.CreateSchoolDTO = {
      name: schoolName,
      slug,
      timezone,
      study_days: normalizedSchedule.study_days || [],
      ...normalizedSchedule,
      address,
    };

    const newSchool = await schoolService.createSchool(schoolData);

    // If the creator is a user (which they should be), update their tenant_id to the new school
    if (req.user && req.user.userId) {
      const user = await User.findByPk(req.user.userId);
      if (user) {
        user.tenant_id = newSchool.id;
        await user.save();

        // Refresh the JWT token with the new tenantId
        const newToken = jwtHelper.signToken({
          userId: user.id,
          roleId: user.role_id,
          tenantId: user.tenant_id,
        });
        
        jwtHelper.setAuthCookie(res, newToken);
      }
    }

    return res.status(201).json({
      message: 'School created successfully',
      school: newSchool
    });
  } catch (error: any) {
    logger.error(`[${logId}] School creation error: ${error.message}`, { stack: error.stack });
    if (error.code) {
      return res.status(400).json(createScheduleErrorResponse(error.message, error.code, error.details));
    }
    return res.status(500).json({ 
      error: 'Failed to create school',
      details: error.message 
    });
  }
};

export const getSchool = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Unauthorized: No school associated with this user' });
    }

    const school = await schoolService.getSchoolById(tenantId);
    const schoolData = school.get({ plain: true });
    return res.json({
      ...schoolData,
      validationMetadata: ScheduleService.getScheduleValidationMetadata(school),
    });
  } catch (error: any) {
    logger.error(`[${logId}] Get school error: ${error.message}`, { stack: error.stack });
    return res.status(500).json({ error: 'Failed to fetch school details' });
  }
};

export const updateSchool = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Unauthorized: No school associated with this user' });
    }

    const { 
      schoolName, slug, timezone, studyDays, startTime, endTime, email, phone, address,
      scheduleMode, sessionTypeDayMap, enabledMemorizationSubtypes 
    } = req.body;

    const currentSchool = await schoolService.getSchoolById(tenantId);
    const studyDayNumbers = mapStudyDaysToNumbers(studyDays);

    const normalizedSchedule = ScheduleService.normalizeScheduleInput({
      scheduleMode,
      studyDays: studyDayNumbers,
      sessionTypeDayMap,
      enabledMemorizationSubtypes
    });

    const effectiveSchedule = {
      schedule_mode: normalizedSchedule.schedule_mode ?? currentSchool.schedule_mode,
      study_days: normalizedSchedule.study_days ?? currentSchool.study_days,
      session_type_day_map:
        normalizedSchedule.session_type_day_map === undefined
          ? currentSchool.session_type_day_map
          : normalizedSchedule.session_type_day_map,
    };

    const scheduleValidation = ScheduleService.validateScheduleConfiguration(effectiveSchedule);
    if (!scheduleValidation.isValid) {
      logger.warn(
        `[${logId}] Schedule overlap rejected during school update for tenantId=${tenantId} overlappingDays=${(scheduleValidation.details?.overlappingDays || []).join(',')}`
      );
      return res
        .status(400)
        .json(createScheduleErrorResponse(scheduleValidation.error || 'Invalid schedule configuration', scheduleValidation.code || 'SCHEDULE_OVERLAP', scheduleValidation.details));
    }

    const retroactiveImpact = await ScheduleService.detectRetroactiveConflicts(
      currentSchool,
      effectiveSchedule,
      tenantId,
      logId
    );

    const updateData: schoolService.UpdateSchoolDTO = {
      name: schoolName,
      slug,
      timezone,
      ...normalizedSchedule,
      start_time: startTime,
      end_time: endTime,
      email,
      phone,
      address,
    };

    const updatedSchool = await schoolService.updateSchool(tenantId, updateData);

    logger.info(
      `[${logId}] School schedule updated for tenantId=${tenantId} oldMode=${currentSchool.schedule_mode} newMode=${updatedSchool.schedule_mode} affectedFutureSessionCount=${retroactiveImpact.affectedSessionCount}`
    );

    return res.json({
      message: 'School updated successfully',
      school: updatedSchool,
      warnings:
        retroactiveImpact.affectedSessionCount > 0
          ? [
              {
                code: 'RETROACTIVE_SCHEDULE_IMPACT',
                message: `Updating this schedule affects ${retroactiveImpact.affectedSessionCount} future session(s).`,
                details: retroactiveImpact,
              },
            ]
          : [],
    });
  } catch (error: any) {
    logger.error(`[${logId}] Update school error: ${error.message}`, { stack: error.stack });
    if (error.code) {
      return res.status(400).json(createScheduleErrorResponse(error.message, error.code, error.details));
    }
    return res.status(500).json({ error: 'Failed to update school details' });
  }
};

export const validateScheduleDraft = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Unauthorized: No school associated with this user' });
    }

    const { scheduleMode, studyDays, sessionTypeDayMap, enabledMemorizationSubtypes } = req.body;
    const normalizedSchedule = ScheduleService.normalizeScheduleInput({
      scheduleMode,
      studyDays: mapStudyDaysToNumbers(studyDays),
      sessionTypeDayMap,
      enabledMemorizationSubtypes,
    });
    const currentSchool = await schoolService.getSchoolById(tenantId);
    const effectiveSchedule = {
      schedule_mode: normalizedSchedule.schedule_mode ?? currentSchool.schedule_mode,
      study_days: normalizedSchedule.study_days ?? currentSchool.study_days,
      session_type_day_map:
        normalizedSchedule.session_type_day_map === undefined
          ? currentSchool.session_type_day_map
          : normalizedSchedule.session_type_day_map,
    };
    const validation = ScheduleService.validateScheduleConfiguration(effectiveSchedule);
    const impact = await ScheduleService.detectRetroactiveConflicts(currentSchool, effectiveSchedule, tenantId, logId);

    return res.json({
      isValid: validation.isValid,
      errors: validation.isValid ? [] : [createScheduleErrorResponse(validation.error || 'Invalid schedule configuration', validation.code || 'SCHEDULE_OVERLAP', validation.details)],
      warnings:
        impact.affectedSessionCount > 0
          ? [
              {
                code: 'RETROACTIVE_SCHEDULE_IMPACT',
                message: `Updating this schedule affects ${impact.affectedSessionCount} future session(s).`,
                details: impact,
              },
            ]
          : [],
    });
  } catch (error: any) {
    logger.error(`[${logId}] Schedule draft validation error: ${error.message}`, { stack: error.stack });
    return res.status(400).json(createScheduleErrorResponse(error.message || 'Failed to validate schedule draft', 'SCHEDULE_VALIDATION_ERROR'));
  }
};

export const getScheduleImpact = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(403).json({ error: 'Unauthorized: No school associated with this user' });
    }

    const rawSchedule = typeof req.query.newSchedule === 'string' ? req.query.newSchedule : '';
    const parsedSchedule = rawSchedule ? JSON.parse(rawSchedule) : {};
    const normalizedSchedule = ScheduleService.normalizeScheduleInput({
      scheduleMode: parsedSchedule.scheduleMode,
      studyDays: mapStudyDaysToNumbers(parsedSchedule.studyDays),
      sessionTypeDayMap: parsedSchedule.sessionTypeDayMap,
      enabledMemorizationSubtypes: parsedSchedule.enabledMemorizationSubtypes,
    });
    const currentSchool = await schoolService.getSchoolById(tenantId);
    const effectiveSchedule = {
      schedule_mode: normalizedSchedule.schedule_mode ?? currentSchool.schedule_mode,
      study_days: normalizedSchedule.study_days ?? currentSchool.study_days,
      session_type_day_map:
        normalizedSchedule.session_type_day_map === undefined
          ? currentSchool.session_type_day_map
          : normalizedSchedule.session_type_day_map,
    };
    const impact = await ScheduleService.detectRetroactiveConflicts(currentSchool, effectiveSchedule, tenantId, logId);

    return res.json(impact);
  } catch (error: any) {
    logger.error(`[${logId}] Schedule impact error: ${error.message}`, { stack: error.stack });
    return res.status(400).json(createScheduleErrorResponse(error.message || 'Failed to evaluate schedule impact', 'SCHEDULE_VALIDATION_ERROR'));
  }
};
