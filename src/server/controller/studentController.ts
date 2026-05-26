import { Request, Response } from 'express';
import * as userService from '../services/userService';
import * as enrollmentService from '../services/enrollmentService';
import { UserRole } from '../model/User';
import * as apiResponse from '../utils/apiResponse';
import logger from '../utils/logger';
import { DEFAULT_PAGE_SIZE } from '../constants';

// Student CRUD
export const getStudents = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || DEFAULT_PAGE_SIZE;

  if (!tenantId) {
    return res.status(403).json(apiResponse.fail('FORBIDDEN', 'Tenant ID required'));
  }

  try {
    const result = await userService.getStudentsWithProgress(tenantId, page, limit);
    res.json(apiResponse.success(result));
  } catch (error: any) {
    logger.error('studentController.getStudents: Error', { correlationId, error: error.message });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to fetch students'));
  }
};

export const createStudent = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json(apiResponse.fail('FORBIDDEN', 'Tenant ID required'));
  }

  try {
    const { firstName, lastName, email, phone, studentIdentifier, enrolledOn, notes, userId } = req.body;

    let student;

    if (userId) {
      // Enroll existing user
      student = await userService.getUserById(userId);
    } else if (email) {
      // Check if user exists with this email
      student = await userService.getUserByEmail(email);
    }

    if (!student) {
      // Create new User
      const userData: userService.CreateUserDTO = {
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        role: UserRole.STUDENT,
        student_identifier: studentIdentifier
      };
      student = await userService.createUser(userData);
    }

    // Check if already enrolled in this tenant
    const existingEnrollment = await enrollmentService.checkStudentEnrollment(student.id, tenantId);
    if (existingEnrollment) {
      return res.status(400).json(apiResponse.fail('ALREADY_ENROLLED', 'Student is already enrolled in this school'));
    }

    // Create Enrollment
    await enrollmentService.createEnrollment({
      tenant_id: tenantId,
      student_id: student.id,
      enrolled_on: enrolledOn,
      notes
    });

    res.status(201).json(apiResponse.success({
      message: 'Student enrolled successfully',
      student
    }));
  } catch (error: any) {
    logger.error('studentController.createStudent: Error', { correlationId, error: error.message });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', error.message || 'Failed to enroll student'));
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json(apiResponse.fail('FORBIDDEN', 'Tenant ID required'));
  }

  try {
    const student = await userService.getStudentProfile(Number(id), tenantId);
    res.json(apiResponse.success({ student }));
  } catch (error: any) {
    logger.error('studentController.getStudentById: Error', { correlationId, error: error.message });
    res.status(404).json(apiResponse.fail('NOT_FOUND', error.message || 'Student not found'));
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const tenantId = req.user?.tenantId;
  const { firstName, lastName, email, phone, studentIdentifier, dailyRevisionTarget } = req.body;

  try {
    const student = await userService.getUserById(Number(id));
    
    // Security check: ensure student belongs to the same tenant
    if (student.tenant_id !== tenantId) {
      return res.status(403).json(apiResponse.fail('FORBIDDEN', 'Access denied'));
    }

    const updatedData = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      student_identifier: studentIdentifier,
      daily_revision_target: dailyRevisionTarget
    };

    const updatedUser = await userService.updateUser(Number(id), updatedData);
    res.json(apiResponse.success({ message: 'Student updated successfully', student: updatedUser }));
  } catch (error: any) {
    logger.error('studentController.updateStudent: Error', { correlationId, error: error.message });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to update student'));
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    const user = await userService.getUserById(Number(id));
    await user.destroy();
    res.json(apiResponse.success({ message: 'Student deleted successfully' }));
  } catch (error: any) {
    logger.error('studentController.deleteStudent: Error', { correlationId, error: error.message });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to delete student'));
  }
};

export const searchStudents = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { query, page, limit } = req.query;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json(apiResponse.fail('FORBIDDEN', 'Tenant ID required'));
  }

  try {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || DEFAULT_PAGE_SIZE;

    const result = await userService.searchStudentsWithProgress(query as string, tenantId, pageNum, limitNum);
    res.json(apiResponse.success(result));
  } catch (error: any) {
    logger.error('studentController.searchStudents: Error', { correlationId, error: error.message });
   return res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to search students'));
  }
};
