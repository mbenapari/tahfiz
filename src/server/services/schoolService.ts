import { School } from '../model';

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
}

export const createSchool = async (data: CreateSchoolDTO) => {
  try {
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
