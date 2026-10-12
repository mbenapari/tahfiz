import { Request, Response } from 'express';
import { User } from '../model';
import * as userService from '../services/userService';
import * as enrollmentService from '../services/enrollmentService';
import { notificationService } from '../services/notificationService';
import { UserRole } from '../model/User';
import * as apiResponse from '../utils/apiResponse';
import logger from '../utils/logger';
import { DEFAULT_PAGE_SIZE } from '../constants';
import { getTenantId } from '../utils/schoolContext';

// Student CRUD
export const getStudents = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  
  try {
    const tenantId = getTenantId(req);
    logger.info(`studentController: getStudents - Fetching students for tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || DEFAULT_PAGE_SIZE;

    const result = await userService.getStudentsWithProgress(tenantId, page, limit);
    res.json(apiResponse.success(result));
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`studentController: getStudents - Error: ${error.message}`, { logId });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to fetch students'));
  }
};

export const createStudent = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';

  try {
    const tenantId = getTenantId(req);
    logger.info(`studentController: createStudent - Enrolling student for tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const { firstName, lastName, email, phone, studentIdentifier, enrolledOn, notes, userId } = req.body;

    let student;

    if (userId) {
      // Enroll existing user
      // Only users already visible in this school can be enrolled by id
      student = await userService.getUserInTenant(Number(userId), tenantId).catch(() => null);
      if (!student) {
        return res.status(404).json(apiResponse.fail('NOT_FOUND', 'Student not found in this school'));
      }
    } else if (email) {
      // Check if user exists with this email
      student = await userService.getUserByEmail(email);
    }

    if (student && student.role !== UserRole.STUDENT) {
      return res.status(400).json(apiResponse.fail('INVALID_USER', 'Only student accounts can be enrolled'));
    }

    const existingAccount = !!student;

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

    await notificationService.notifyTenantAdmins(
      tenantId,
      {
        title: 'New student enrolled',
        message: `${student.first_name} ${student.last_name || ''}`.trim() + ' was enrolled.',
        type: 'success',
      },
      req.user?.userId
    );

    // Re-read so PII fields come back decrypted, matching the GET endpoints
    student = (await User.findByPk(student.id)) || student;

    res.status(201).json(apiResponse.success({
      message: 'Student enrolled successfully',
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        // Contact details are only echoed for accounts created in this request;
        // an existing account (possibly from another school) is not disclosed.
        ...(existingAccount ? {} : {
          email: student.email,
          phone: student.phone,
          student_identifier: student.student_identifier,
        }),
      }
    }));
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`studentController: createStudent - Error: ${error.message}`, { logId });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', error.message || 'Failed to enroll student'));
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { id } = req.params;
  const { limit } = req.query;

  try {
    const tenantId = getTenantId(req);
    logger.info(`studentController: getStudentById - Fetching profile for studentId: ${id}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const activityLimit = limit ? Number(limit) : 5;
    const student = await userService.getStudentProfile(Number(id), tenantId, activityLimit);
    res.json(apiResponse.success({ student }));
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`studentController: getStudentById - Error: ${error.message}`, { logId });
    res.status(404).json(apiResponse.fail('NOT_FOUND', error.message || 'Student not found'));
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { id } = req.params;
  const { firstName, lastName, email, phone, studentIdentifier, dailyRevisionTarget } = req.body;

  try {
    const tenantId = getTenantId(req);
    logger.info(`studentController: updateStudent - Updating studentId: ${id}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
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
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`studentController: updateStudent - Error: ${error.message}`, { logId });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to update student'));
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { id } = req.params;

  try {
    const tenantId = getTenantId(req);
    logger.info(`studentController: deleteStudent - Deleting studentId: ${id}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const user = await userService.getUserById(Number(id));
    
    // Security check: ensure user belongs to the same tenant
    if (user.tenant_id !== tenantId) {
      return res.status(403).json(apiResponse.fail('FORBIDDEN', 'Access denied'));
    }

    await user.destroy();
    res.json(apiResponse.success({ message: 'Student deleted successfully' }));
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`studentController: deleteStudent - Error: ${error.message}`, { logId });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to delete student'));
  }
};

export const searchStudents = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { query, page, limit } = req.query;

  try {
    const tenantId = getTenantId(req);
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || DEFAULT_PAGE_SIZE;

    logger.info(`studentController: searchStudents - query="${query}", tenantId=${tenantId}, page=${pageNum}, limit=${limitNum}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });

    const result = await userService.searchStudentsWithProgress(query as string, tenantId, pageNum, limitNum, logId);
    logger.info(`studentController: searchStudents - Returning ${result.students.length} results (total=${result.pagination.total})`, { logId });

    res.json(apiResponse.success(result));
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`studentController: searchStudents - Search failed - query="${query}", error="${error.message}"`, { logId });
   return res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to search students'));
  }
};
