import { Enrollment, User, School } from '../model';
import { EnrollmentStatus } from '../model/Enrollment';

export interface CreateEnrollmentDTO {
  tenant_id: number;
  student_id: number;
  enrolled_on?: string;
  status?: EnrollmentStatus;
  notes?: string;
}

export interface UpdateEnrollmentDTO {
  status?: EnrollmentStatus;
  notes?: string;
  enrolled_on?: string;
}

export const createEnrollment = async (data: CreateEnrollmentDTO) => {
  try {
    const enrollment = await Enrollment.create(data);
    return enrollment;
  } catch (error) {
    throw error;
  }
};

export const getEnrollmentById = async (id: number, tenant_id: number) => {
  try {
    const enrollment = await Enrollment.findOne({
      where: { id, tenant_id },
      include: [
        { model: User, as: 'student' },
        { model: School, as: 'tenant' }
      ]
    });
    if (!enrollment) {
      throw new Error('Enrollment not found');
    }
    return enrollment;
  } catch (error) {
    throw error;
  }
};

export const getEnrollmentsByStudent = async (student_id: number, tenant_id: number) => {
  try {
    const enrollments = await Enrollment.findAll({
      where: { student_id, tenant_id },
      include: [{ model: School, as: 'tenant' }]
    });
    return enrollments;
  } catch (error) {
    throw error;
  }
};

export const getEnrollmentsByTenant = async (tenant_id: number, status?: EnrollmentStatus) => {
  try {
    const whereClause: any = { tenant_id };
    if (status) {
      whereClause.status = status;
    }

    const enrollments = await Enrollment.findAll({
      where: whereClause,
      include: [{ model: User, as: 'student' }]
    });
    return enrollments;
  } catch (error) {
    throw error;
  }
};

export const updateEnrollment = async (id: number, tenant_id: number, data: UpdateEnrollmentDTO) => {
  try {
    const enrollment = await getEnrollmentById(id, tenant_id);
    await enrollment.update(data);
    return enrollment;
  } catch (error) {
    throw error;
  }
};

export const deleteEnrollment = async (id: number, tenant_id: number) => {
  try {
    const enrollment = await getEnrollmentById(id, tenant_id);
    await enrollment.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

export const checkStudentEnrollment = async (student_id: number, tenant_id: number) => {
  try {
    const enrollment = await Enrollment.findOne({
      where: {
        student_id,
        tenant_id,
        status: EnrollmentStatus.ACTIVE
      }
    });
    return !!enrollment;
  } catch (error) {
    throw error;
  }
};
