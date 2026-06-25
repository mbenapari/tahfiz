import { School } from '../model';
import { ScheduleService } from './scheduleService';

export interface CreateSchoolDTO {
  name: string;
  slug: string;
  timezone?: string;
  study_days: number[];
  start_time?: string;
  end_time?: string;
  email?: string;
  phone?: string;
  address?: string;
  schedule_mode?: 'simple' | 'advanced';
  session_type_day_map?: Record<string, number[]> | null;
  enabled_memorization_subtypes?: Array<{ key: string; label: string; active: boolean }> | null;
}

export interface UpdateSchoolDTO {
  name?: string;
  slug?: string;
  timezone?: string;
  study_days?: number[];
  start_time?: string;
  end_time?: string;
  email?: string;
  phone?: string;
  address?: string;
  schedule_mode?: 'simple' | 'advanced';
  session_type_day_map?: Record<string, number[]> | null;
  enabled_memorization_subtypes?: Array<{ key: string; label: string; active: boolean }> | null;
}

export const createSchool = async (data: CreateSchoolDTO) => {
  try {
    const validation = ScheduleService.validateScheduleConfiguration({
      schedule_mode: data.schedule_mode,
      study_days: data.study_days,
      session_type_day_map: data.session_type_day_map,
    });

    if (!validation.isValid) {
      const error = new Error(validation.error || 'Invalid schedule configuration');
      (error as any).code = validation.code;
      (error as any).details = validation.details;
      throw error;
    }

    const school = await School.create({
      ...data,
      timezone: data.timezone || 'UTC',
    });
    return school;
  } catch (error) {
    throw error;
  }
};

export const getSchoolById = async (id: number) => {
  try {
    const school = await School.findByPk(id);
    if (!school) {
      throw new Error('School not found');
    }
    return school;
  } catch (error) {
    throw error;
  }
};

export const getSchoolsByName = async (name: string) => {
  try {
    const schools = await School.findAll({
      where: { name },
    });
    return schools;
  } catch (error) {
    throw error;
  }
};

export const getAllSchools = async () => {
  try {
    const schools = await School.findAll();
    return schools;
  } catch (error) {
    throw error;
  }
};

export const updateSchool = async (id: number, data: UpdateSchoolDTO) => {
  try {
    const school = await getSchoolById(id);
    const mergedSchedule = {
      schedule_mode: data.schedule_mode ?? school.schedule_mode,
      study_days: data.study_days ?? school.study_days,
      session_type_day_map:
        data.session_type_day_map === undefined ? school.session_type_day_map : data.session_type_day_map,
    };

    const validation = ScheduleService.validateScheduleConfiguration(mergedSchedule);
    if (!validation.isValid) {
      const error = new Error(validation.error || 'Invalid schedule configuration');
      (error as any).code = validation.code;
      (error as any).details = validation.details;
      throw error;
    }

    await school.update(data);
    return school;
  } catch (error) {
    throw error;
  }
};

export const deleteSchool = async (id: number) => {
  try {
    const school = await getSchoolById(id);
    await school.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};
