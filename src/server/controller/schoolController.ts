import { Request, Response } from 'express';
import * as schoolService from '../services/schoolService';
import { User } from '../model';
import * as jwtHelper from '../helper/jwtHelper';
import { ScheduleService } from '../services/scheduleService';
import logger from '../utils/logger';
import { getTenantId } from '../utils/schoolContext';

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

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const createScheduleErrorResponse = (error: string, code: string, details?: Record<string, unknown>) => ({
  error,
  code,
  details,
});

export const createSchool = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const { schoolName, slug, timezone, studyDays, address, scheduleMode, sessionTypeDayMap, enabledMemorizationSubtypes } = req.body;

    if (!schoolName || !slug) {
      return res.status(400).json({ error: 'School name and slug are required' });
    }

    const studyDayNumbers = mapStudyDaysToNumbers(studyDays) || ALL_DAYS;

    const normalizedSchedule = ScheduleService.normalizeScheduleInput({
      scheduleMode,
      studyDays: studyDayNumbers,
      sessionTypeDayMap,
      enabledMemorizationSubtypes
    });

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to create a school' });
    }

    const schoolData: schoolService.CreateSchoolDTO = {
      name: schoolName,
      slug,
      owner_id: userId,
      timezone,
      study_days: normalizedSchedule.study_days || [],
      ...normalizedSchedule,
      address,
    };

    const newSchool = await schoolService.createSchool(schoolData);

    // Set the creator's tenant_id to the new school and refresh their JWT
    const user = await User.findByPk(userId);
    if (user) {
      user.tenant_id = newSchool.id;
      await user.save();
      const newToken = jwtHelper.signToken({
        userId: user.id,
        roleId: user.role_id,
        tenantId: user.tenant_id,
      });
      jwtHelper.setAuthCookie(res, newToken);
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
    const tenantId = getTenantId(req);
    logger.info(`schoolController: getSchool - Fetching details for tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });

    const school = await schoolService.getSchoolById(tenantId);
    const schoolData = school.get({ plain: true });
    return res.json({
      ...schoolData,
    });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`schoolController: getSchool - Error: ${error.message}`, { logId });
    return res.status(500).json({ error: 'Failed to fetch school details' });
  }
};

export const updateSchool = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  try {
    const tenantId = getTenantId(req);
    logger.info(`schoolController: updateSchool - Updating school for tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });

    const {
      schoolName, slug, timezone, startTime, endTime, email, phone, address,
      enabledMemorizationSubtypes
    } = req.body;

    const normalizedSettings = ScheduleService.normalizeScheduleInput({ enabledMemorizationSubtypes });

    const updateData: schoolService.UpdateSchoolDTO = {
      name: schoolName,
      slug,
      timezone,
      ...normalizedSettings,
      start_time: startTime,
      end_time: endTime,
      email,
      phone,
      address,
    };

    const updatedSchool = await schoolService.updateSchool(tenantId, updateData);

    logger.info(`schoolController: updateSchool - Success: tenantId=${tenantId}`, { logId });

    return res.json({
      message: 'School updated successfully',
      school: updatedSchool,
    });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`schoolController: updateSchool - Error: ${error.message}`, { logId });
    if (error.code) {
      return res.status(400).json(createScheduleErrorResponse(error.message, error.code, error.details));
    }
    return res.status(500).json({ error: 'Failed to update school details' });
  }
};
