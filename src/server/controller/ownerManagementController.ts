import { Request, Response } from 'express';
import * as schoolService from '../services/schoolService';
import * as userService from '../services/userService';
import * as ownerService from '../services/systemOwnerService';
import logger from '../utils/logger';
import { ScheduleService } from '../services/scheduleService';

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

const buildOwnerSchoolDto = (payload: any): schoolService.CreateSchoolDTO => {
  const normalizedSchedule = ScheduleService.normalizeScheduleInput({
    scheduleMode: payload.schedule_mode || payload.scheduleMode,
    studyDays: mapStudyDaysToNumbers(payload.studyDays || payload.study_days),
    sessionTypeDayMap: payload.session_type_day_map || payload.sessionTypeDayMap,
    enabledMemorizationSubtypes: payload.enabled_memorization_subtypes || payload.enabledMemorizationSubtypes,
  });

  return {
    name: payload.name || payload.schoolName,
    slug: payload.slug,
    timezone: payload.timezone,
    study_days: normalizedSchedule.study_days || [],
    schedule_mode: normalizedSchedule.schedule_mode || 'simple',
    session_type_day_map:
      normalizedSchedule.session_type_day_map === undefined ? null : normalizedSchedule.session_type_day_map,
    enabled_memorization_subtypes:
      normalizedSchedule.enabled_memorization_subtypes === undefined ? [] : normalizedSchedule.enabled_memorization_subtypes,
    start_time: payload.start_time || payload.startTime,
    end_time: payload.end_time || payload.endTime,
    email: payload.email,
    phone: payload.phone,
    address: payload.address,
  };
};

/* Schools */
export const listSchools = async (_req: Request, res: Response) => {
  try {
    const schools = await schoolService.getAllSchools();
    res.json(schools);
  } catch (error: any) {
    logger.error('ownerManagement.listSchools error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const createSchool = async (req: Request, res: Response) => {
  try {
    const school = await schoolService.createSchool(buildOwnerSchoolDto(req.body));
    res.status(201).json(school);
  } catch (error: any) {
    logger.error('ownerManagement.createSchool error', { error: error.message });
    res.status(error.code ? 400 : 500).json({
      error: error.message,
      code: error.code,
      details: error.details,
    });
  }
};

export const updateSchool = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const payload = buildOwnerSchoolDto(req.body);
    const school = await schoolService.updateSchool(id, payload);
    res.json(school);
  } catch (error: any) {
    logger.error('ownerManagement.updateSchool error', { error: error.message });
    res.status(error.code ? 400 : 500).json({
      error: error.message,
      code: error.code,
      details: error.details,
    });
  }
};

export const deleteSchool = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await schoolService.deleteSchool(id);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('ownerManagement.deleteSchool error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/* Users */
export const listUsers = async (_req: Request, res: Response) => {
  try {
    // Platform-wide users
    const users = await (userService as any).getAllPlatformUsers?.() ?? [];
    res.json(users);
  } catch (error: any) {
    logger.error('ownerManagement.listUsers error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const user = await userService.createUser(payload as any);
    res.status(201).json(user);
  } catch (error: any) {
    logger.error('ownerManagement.createUser error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const payload = req.body;
    const user = await userService.updateUser(id, payload as any);
    res.json(user);
  } catch (error: any) {
    logger.error('ownerManagement.updateUser error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // Soft delete via User model
    await (userService as any).deleteUserById(id);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('ownerManagement.deleteUser error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/* System Owners */
export const listOwners = async (_req: Request, res: Response) => {
  try {
    const owners = await ownerService.getAllSystemOwners();
    res.json(owners);
  } catch (error: any) {
    logger.error('ownerManagement.listOwners error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const createOwner = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const owner = await ownerService.createSystemOwner(payload as any);
    res.status(201).json(owner);
  } catch (error: any) {
    logger.error('ownerManagement.createOwner error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const updateOwner = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const payload = req.body;
    const owner = await ownerService.updateSystemOwner(id, payload as any);
    res.json(owner);
  } catch (error: any) {
    logger.error('ownerManagement.updateOwner error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const deleteOwner = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await ownerService.deleteSystemOwner(id);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('ownerManagement.deleteOwner error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export default {
  listSchools,
  createSchool,
  updateSchool,
  deleteSchool,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listOwners,
  createOwner,
  updateOwner,
  deleteOwner,
};
