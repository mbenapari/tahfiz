import { Request, Response } from 'express';
import * as userService from '../services/userService';
import * as permissionService from '../services/permissionService';
import { notificationService } from '../services/notificationService';
import { UserRole } from '../model/User';
import { SchoolMember, User } from '../model';
import sequelize from '../db';
import * as apiResponse from '../utils/apiResponse';
import logger from '../utils/logger';
import { getTenantId } from '../utils/schoolContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getInstructors = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';

  try {
    const tenantId = getTenantId(req);
    logger.info(`instructorController: getInstructors - Fetching instructors for tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const instructors = await userService.getInstructorsByTenant(tenantId);
    return res.json(apiResponse.success({ instructors }));
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`instructorController: getInstructors - Error: ${error.message}`, { logId });
    return res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to fetch instructors'));
  }
};

export const createInstructor = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';

  try {
    const tenantId = getTenantId(req);
    logger.info(`instructorController: createInstructor - Creating instructor for tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });

    // Check if user has permission to manage users
    const hasPermission = await permissionService.hasPermission(req.user!.userId, 'users:manage', logId);
    if (!hasPermission) {
      return res.status(403).json(apiResponse.fail('FORBIDDEN', 'Forbidden: You do not have permission to manage users'));
    }

    const t = await sequelize.transaction();

    try {
      const { firstName, lastName, email, phone, password } = req.body;

      // Validation
      if (!firstName || !email || !password) {
        logger.warn(`instructorController: createInstructor - Validation Failure - Missing fields`, { logId });
        await t.rollback();
        return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'First name, email, and password are required'));
      }

      if (!EMAIL_REGEX.test(email)) {
        logger.warn(`instructorController: createInstructor - Validation Failure - Invalid email`, { logId });
        await t.rollback();
        return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'Invalid email format'));
      }

      // Check if user already exists
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser) {
        logger.warn(`instructorController: createInstructor - Duplicate Email: ${email}`, { logId });
        await t.rollback();
        return res.status(409).json(apiResponse.fail('DUPLICATE_EMAIL', 'Email already registered'));
      }

      const userData: userService.CreateUserDTO = {
        tenant_id: tenantId,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password,
        role: UserRole.INSTRUCTOR,
      };

      const instructor = await userService.createUser(userData, t);

      // Add to SchoolMember table for consistency
       await SchoolMember.create({
         school_id: tenantId,
         user_id: instructor.id,
         role: UserRole.INSTRUCTOR
       }, { transaction: t });

      await t.commit();

      await notificationService.notifyTenantAdmins(
        tenantId,
        {
          title: 'New instructor added',
          message: `${instructor.first_name} ${instructor.last_name || ''}`.trim() + ' was added as an instructor.',
          type: 'success',
        },
        req.user?.userId
      );

      logger.info(`instructorController: createInstructor - Success: instructorId: ${instructor.id}`, { logId });
      const fresh = (await User.findByPk(instructor.id)) || instructor;
      res.status(201).json(apiResponse.success({
        message: 'Instructor created successfully',
        instructor: {
          id: instructor.id,
          first_name: instructor.first_name,
          last_name: instructor.last_name,
          email: fresh.email,
          phone: fresh.phone,
          role: instructor.role,
          tenantId: instructor.tenant_id,
        }
      }));
    } catch (error: any) {
      await t.rollback();
      throw error;
    }
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`instructorController: createInstructor - Error: ${error.message}`, { logId });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', error.message || 'Failed to create instructor'));
  }
};

export const getInstructorById = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { id } = req.params;

  try {
    const tenantId = getTenantId(req);
    logger.info(`instructorController: getInstructorById - Fetching instructorId: ${id}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const instructor = await userService.getUserInTenant(Number(id), tenantId);
    
    if (instructor.role !== UserRole.INSTRUCTOR) {
      return res.status(404).json(apiResponse.fail('NOT_FOUND', 'Instructor not found'));
    }

    logger.debug(`instructorController: getInstructorById - Success: instructorId: ${id}`, { logId });
    res.json(apiResponse.success({
      instructor: {
        id: instructor.id,
        first_name: instructor.first_name,
        last_name: instructor.last_name,
        email: instructor.email,
        phone: instructor.phone,
        role: instructor.role,
        tenant_id: instructor.tenant_id,
      }
    }));
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`instructorController: getInstructorById - Error: ${error.message}`, { logId });
    res.status(404).json(apiResponse.fail('NOT_FOUND', error.message || 'Instructor not found'));
  }
};

export const updateInstructor = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { id } = req.params;
  const { firstName, lastName, email, phone, password } = req.body;

  try {
    const tenantId = getTenantId(req);
    logger.info(`instructorController: updateInstructor - Updating instructorId: ${id}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });

    // Check if user has permission to manage users
    const hasPermission = await permissionService.hasPermission(req.user!.userId, 'users:manage');
    if (!hasPermission) {
      return res.status(403).json(apiResponse.fail('FORBIDDEN', 'Forbidden: You do not have permission to manage users'));
    }

    const instructor = await userService.getUserInTenant(Number(id), tenantId);
    
    if (instructor.role !== UserRole.INSTRUCTOR) {
      return res.status(404).json(apiResponse.fail('NOT_FOUND', 'Instructor not found'));
    }

    // Validate email if provided
    if (email && !EMAIL_REGEX.test(email)) {
      logger.warn(`instructorController: updateInstructor - Invalid email format: ${email}`, { logId });
      return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'Invalid email format'));
    }

    // Check if email is already taken by another user
    if (email && email !== instructor.email) {
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser && existingUser.id !== Number(id)) {
        logger.warn(`instructorController: updateInstructor - Email already taken: ${email}`, { logId });
        return res.status(409).json(apiResponse.fail('DUPLICATE_EMAIL', 'Email already in use'));
      }
    }

    const updateData: userService.UpdateUserDTO = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      password,
    };

    const updatedInstructor = await userService.updateUser(Number(id), updateData);

    logger.info(`instructorController: updateInstructor - Success: instructorId: ${id}`, { logId });
    res.json(apiResponse.success({
      message: 'Instructor updated successfully',
      instructor: {
        id: updatedInstructor.id,
        first_name: updatedInstructor.first_name,
        last_name: updatedInstructor.last_name,
        email: updatedInstructor.email,
        phone: updatedInstructor.phone,
        role: updatedInstructor.role,
        tenant_id: updatedInstructor.tenant_id,
      }
    }));
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`instructorController: updateInstructor - Error: ${error.message}`, { logId });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', error.message || 'Failed to update instructor'));
  }
};

export const deleteInstructor = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { id } = req.params;

  try {
    const tenantId = getTenantId(req);
    logger.info(`instructorController: deleteInstructor - Deleting instructorId: ${id}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });

    // Check if user has permission to manage users
    const hasPermission = await permissionService.hasPermission(req.user!.userId, 'users:manage');
    if (!hasPermission) {
      return res.status(403).json(apiResponse.fail('FORBIDDEN', 'Forbidden: You do not have permission to manage users'));
    }

    const instructor = await userService.getUserInTenant(Number(id), tenantId);
    
    if (instructor.role !== UserRole.INSTRUCTOR) {
      return res.status(404).json(apiResponse.fail('NOT_FOUND', 'Instructor not found'));
    }

    await instructor.destroy();
    res.json(apiResponse.success({ message: 'Instructor deleted successfully' }));
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`instructorController: deleteInstructor - Error: ${error.message}`, { logId });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to delete instructor'));
  }
};
