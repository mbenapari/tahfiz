import { Request, Response } from 'express';
import * as userService from '../services/userService';
import * as enrollmentService from '../services/enrollmentService';
import { UserRole } from '../model/User';
import { User, Role, School, SchoolMember, BlacklistedToken } from '../model';
import * as jwtHelper from '../helper/jwtHelper';
import * as permissionService from '../services/permissionService';
import logger from '../utils/logger';
import sequelize from '../db';
import jwt from 'jsonwebtoken';
import { DEFAULT_PAGE_SIZE } from '../constants';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export const register = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  logger.info('userController.register: Entry', { correlationId, email: req.body.email });
  
  try {
    const { firstName, lastName, email, password, phone, role, tenantId } = req.body;

    // Comprehensive Input Validation
    if (!firstName || !email || !password || !role) {
      logger.warn('userController.register: Validation Failure - Missing fields', { correlationId, email });
      return res.status(400).json({ error: 'First name, email, password, and role are required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      logger.warn('userController.register: Validation Failure - Invalid email', { correlationId, email });
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      logger.warn('userController.register: Validation Failure - Password too short', { correlationId, email });
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
    }

    // Map frontend role to backend UserRole enum
    let userRole: UserRole;
    switch (role.toLowerCase()) {
      case 'admin':
        userRole = UserRole.ADMIN;
        break;
      case 'instructor':
        userRole = UserRole.INSTRUCTOR;
        break;
      case 'student':
        userRole = UserRole.STUDENT;
        break;
      default:
        logger.warn('userController.register: Validation Failure - Invalid role', { correlationId, role });
        return res.status(400).json({ error: 'Invalid role specified' });
    }

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      logger.warn('userController.register: Duplicate Email', { correlationId, email });
      return res.status(409).json({ error: 'Email already registered' });
    }

    const userData: userService.CreateUserDTO = {
      tenant_id: tenantId,
      first_name: firstName,
      last_name: lastName,
      email,
      password, // Will be hashed by User model hooks
      phone,
      role: userRole,
    };

    const newUser = await userService.createUser(userData);
    
    // Fetch full user with tenant info for the response
    const userWithTenant = await userService.getUserById(newUser.id);
    
    // Auto-login: Generate Token and Set Cookie
    const token = jwtHelper.signToken({
      userId: userWithTenant.id,
      roleId: userWithTenant.role_id,
      tenantId: userWithTenant.tenant_id,
    });
    
    jwtHelper.setAuthCookie(res, token);
    logger.debug('userController.register: Auth cookie set', { correlationId, userId: userWithTenant.id });

    // Get effective permissions
    const permissions = await permissionService.getEffectivePermissions(userWithTenant.id);

    logger.info('userController.register: Success', { correlationId, userId: userWithTenant.id });
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: userWithTenant.id,
        first_name: userWithTenant.first_name,
        last_name: userWithTenant.last_name,
        email: userWithTenant.email,
        role: userWithTenant.role,
        tenantId: userWithTenant.tenant_id,
        is_onboarded: Boolean(userWithTenant.is_onboarded),
        school_name: userWithTenant.tenant?.name,
        permissions
      }
    });
  } catch (error: any) {
    logger.error('userController.register: Unexpected Error', { 
      correlationId, 
      error: error.message, 
      stack: error.stack 
    });
    return res.status(500).json({ 
      error: 'Failed to register user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const login = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  logger.info('userController.login: Entry', { correlationId, email: req.body.email });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn('userController.login: Validation Failure - Missing credentials', { correlationId });
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Generic error message for security
    const INVALID_CREDENTIALS_MSG = 'Invalid credentials';

    const user = await userService.getUserByEmail(email); 

    // Timing attack mitigation (simulate work if user not found) - optional but good
    if (!user) {
       logger.warn('userController.login: User not found', { correlationId, email });
       return res.status(401).json({ error: INVALID_CREDENTIALS_MSG });
    }

    // Verify password using the instance method which uses bcrypt.compare
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      logger.warn('userController.login: Invalid Password', { correlationId, userId: user.id, email });
      return res.status(401).json({ error: INVALID_CREDENTIALS_MSG });
    }

    const token = jwtHelper.signToken({
      userId: user.id,
      roleId: user.role_id,
      tenantId: user.tenant_id,
    });

    jwtHelper.setAuthCookie(res, token);
    logger.debug('userController.login: Auth cookie set', { correlationId, userId: user.id });

    // Get effective permissions
    const permissions = await permissionService.getEffectivePermissions(user.id);

    logger.info('userController.login: Success', { correlationId, userId: user.id });
    return res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        is_onboarded: Boolean(user.is_onboarded),
        school_name: user.tenant?.name,
        permissions
      }
    });
  } catch (error: any) {
    logger.error('userController.login: Unexpected Error', { 
      correlationId, 
      error: error.message, 
      stack: error.stack 
    });
    return res.status(500).json({ error: 'Login failed' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const token = req.cookies.jwt;

  if (token) {
    try {
      // Decode token to get expiration
      const decoded = jwt.decode(token) as any;
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Add to blacklist
      await BlacklistedToken.create({
        token,
        expires_at: expiresAt
      });
      logger.info('userController.logout: Token blacklisted', { correlationId });
    } catch (error: any) {
      logger.error('userController.logout: Error blacklisting token', { correlationId, error: error.message });
      // Continue with clearing cookie even if blacklisting fails
    }
  }

  res.clearCookie('jwt');
  res.json({ message: 'Logged out successfully' });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  logger.debug('userController.getCurrentUser: Entry', { correlationId });
  
  try {
    if (!req.user) {
      logger.warn('userController.getCurrentUser: Not authenticated', { correlationId });
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const user = await userService.getUserById(req.user.userId);
    const permissions = await permissionService.getEffectivePermissions(user.id);
    
    logger.debug('userController.getCurrentUser: Success', { correlationId, userId: user.id });
    res.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenant_id,
        is_onboarded: Boolean(user.is_onboarded),
        school_name: user.tenant?.name,
        created_at: user.created_at,
        permissions
      }
    });
  } catch (error: any) {
    logger.error('userController.getCurrentUser: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const updateCurrentUser = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  logger.info('userController.updateCurrentUser: Entry', { correlationId });

  try {
    if (!req.user) {
      logger.warn('userController.updateCurrentUser: Not authenticated', { correlationId });
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { firstName, lastName, email, phone, currentPassword, newPassword } = req.body;

    // Validate input
    if (email && !EMAIL_REGEX.test(email)) {
      logger.warn('userController.updateCurrentUser: Invalid email', { correlationId });
      return res.status(400).json({ error: 'Invalid email format' });
    }

    if (newPassword && newPassword.length < MIN_PASSWORD_LENGTH) {
      logger.warn('userController.updateCurrentUser: Password too short', { correlationId });
      return res.status(400).json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long` });
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        logger.warn('userController.updateCurrentUser: Current password required', { correlationId });
        return res.status(400).json({ error: 'Current password is required to change password' });
      }

      const user = await userService.getUserById(req.user.userId);
      const isCurrentPasswordValid = await user.validatePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        logger.warn('userController.updateCurrentUser: Invalid current password', { correlationId, userId: user.id });
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser && existingUser.id !== req.user.userId) {
        logger.warn('userController.updateCurrentUser: Email already taken', { correlationId, email });
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const updateData: userService.UpdateUserDTO = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      ...(newPassword && { password: newPassword })
    };

    const updatedUser = await userService.updateUser(req.user.userId, updateData);
    const permissions = await permissionService.getEffectivePermissions(updatedUser.id);

    logger.info('userController.updateCurrentUser: Success', { correlationId, userId: updatedUser.id });
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        tenantId: updatedUser.tenant_id,
        is_onboarded: Boolean(updatedUser.is_onboarded),
        school_name: updatedUser.tenant?.name,
        permissions
      }
    });
  } catch (error: any) {
    logger.error('userController.updateCurrentUser: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const completeOnboarding = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  logger.info('userController.completeOnboarding: Entry', { correlationId });

  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    await userService.updateUser(req.user.userId, { is_onboarded: true });

    logger.info('userController.completeOnboarding: Success', { correlationId, userId: req.user.userId });
    res.json({ message: 'Onboarding marked as complete' });
  } catch (error: any) {
    logger.error('userController.completeOnboarding: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
};

// Student CRUD
export const getStudents = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || DEFAULT_PAGE_SIZE;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  try {
    const result = await userService.getStudentsWithProgress(tenantId, page, limit);
    res.json(result);
  } catch (error: any) {
    logger.error('userController.getStudents: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

export const createStudent = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
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
      return res.status(400).json({ error: 'Student is already enrolled in this school' });
    }

    // Create Enrollment
    await enrollmentService.createEnrollment({
      tenant_id: tenantId,
      student_id: student.id,
      enrolled_on: enrolledOn,
      notes
    });

    res.status(201).json({
      message: 'Student enrolled successfully',
      student
    });
  } catch (error: any) {
    logger.error('userController.createStudent: Error', { correlationId, error: error.message });
    res.status(500).json({ error: error.message || 'Failed to enroll student' });
  }
};

export const getStudentById = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  try {
    const student = await userService.getStudentProfile(Number(id), tenantId);
    res.json({ student });
  } catch (error: any) {
    logger.error('userController.getStudentById: Error', { correlationId, error: error.message });
    res.status(404).json({ error: error.message || 'Student not found' });
  }
};

export const updateStudent = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const tenantId = req.user?.tenantId;
  const { firstName, lastName, email, phone, studentIdentifier } = req.body;

  try {
    const student = await userService.getUserById(Number(id));
    
    // Security check: ensure student belongs to the same tenant
    if (student.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedData = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      student_identifier: studentIdentifier
    };

    const updatedUser = await userService.updateUser(Number(id), updatedData);
    res.json({ message: 'Student updated successfully', student: updatedUser });
  } catch (error: any) {
    logger.error('userController.updateStudent: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to update student' });
  }
};

export const deleteStudent = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;

  try {
    const user = await userService.getUserById(Number(id));
    await user.destroy();
    res.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    logger.error('userController.deleteStudent: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to delete student' });
  }
};

export const searchStudents = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { query, page, limit } = req.query;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  try {
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || DEFAULT_PAGE_SIZE;

    const result = await userService.searchStudentsWithProgress(query as string, tenantId, pageNum, limitNum);
    res.json(result);
  } catch (error: any) {
    logger.error('userController.searchStudents: Error', { correlationId, error: error.message });
   return res.status(500).json({ error: 'Failed to search students' });
  }
};

export const getInstructors = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({ error: 'Unauthorized: No school associated with this user' });
  }

  try {
    const instructors = await userService.getInstructorsByTenant(tenantId);
    return res.json({ instructors });
  } catch (error: any) {
    logger.error('userController.getInstructors: Error', { correlationId, error: error.message });
    return res.status(500).json({ error: 'Failed to fetch instructors' });
  }
};

export const createInstructor = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  // Check if user has permission to manage users
  const hasPermission = await permissionService.hasPermission(req.user!.userId, 'users:manage');
  if (!hasPermission) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to manage users' });
  }

  const t = await sequelize.transaction();

  try {
    const { firstName, lastName, email, phone, password } = req.body;

    // Validation
    if (!firstName || !email || !password) {
      logger.warn('userController.createInstructor: Validation Failure - Missing fields', { correlationId });
      await t.rollback();
      return res.status(400).json({ error: 'First name, email, and password are required' });
    }

    if (!EMAIL_REGEX.test(email)) {
      logger.warn('userController.createInstructor: Validation Failure - Invalid email', { correlationId });
      await t.rollback();
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      logger.warn('userController.createInstructor: Duplicate Email', { correlationId, email });
      await t.rollback();
      return res.status(409).json({ error: 'Email already registered' });
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

    logger.info('userController.createInstructor: Success', { correlationId, instructorId: instructor.id });
    res.status(201).json({
      message: 'Instructor created successfully',
      instructor: {
        id: instructor.id,
        first_name: instructor.first_name,
        last_name: instructor.last_name,
        email: instructor.email,
        phone: instructor.phone,
        role: instructor.role,
        tenantId: instructor.tenant_id,
      }
    });
  } catch (error: any) {
    await t.rollback();
    logger.error('userController.createInstructor: Error', { correlationId, error: error.message });
    res.status(500).json({ error: error.message || 'Failed to create instructor' });
  }
};

export const getInstructorById = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  try {
    const instructor = await userService.getUserInTenant(Number(id), tenantId);
    
    if (instructor.role !== UserRole.INSTRUCTOR) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    logger.debug('userController.getInstructorById: Success', { correlationId, instructorId: id });
    res.json({
      instructor: {
        id: instructor.id,
        first_name: instructor.first_name,
        last_name: instructor.last_name,
        email: instructor.email,
        phone: instructor.phone,
        role: instructor.role,
        tenant_id: instructor.tenant_id,
      }
    });
  } catch (error: any) {
    logger.error('userController.getInstructorById: Error', { correlationId, error: error.message });
    res.status(404).json({ error: error.message || 'Instructor not found' });
  }
};

export const updateInstructor = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const tenantId = req.user?.tenantId;
  const { firstName, lastName, email, phone, password } = req.body;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  // Check if user has permission to manage users
  const hasPermission = await permissionService.hasPermission(req.user!.userId, 'users:manage');
  if (!hasPermission) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to manage users' });
  }

  try {
    const instructor = await userService.getUserInTenant(Number(id), tenantId);
    
    if (instructor.role !== UserRole.INSTRUCTOR) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    // Validate email if provided
    if (email && !EMAIL_REGEX.test(email)) {
      logger.warn('userController.updateInstructor: Invalid email', { correlationId });
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Check if email is already taken by another user
    if (email && email !== instructor.email) {
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser && existingUser.id !== Number(id)) {
        logger.warn('userController.updateInstructor: Email already taken', { correlationId, email });
        return res.status(409).json({ error: 'Email already in use' });
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

    logger.info('userController.updateInstructor: Success', { correlationId, instructorId: id });
    res.json({
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
    });
  } catch (error: any) {
    logger.error('userController.updateInstructor: Error', { correlationId, error: error.message });
    res.status(500).json({ error: error.message || 'Failed to update instructor' });
  }
};

export const deleteInstructor = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { id } = req.params;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(403).json({ error: 'Tenant ID required' });
  }

  // Check if user has permission to manage users
  const hasPermission = await permissionService.hasPermission(req.user!.userId, 'users:manage');
  if (!hasPermission) {
    return res.status(403).json({ error: 'Forbidden: You do not have permission to manage users' });
  }

  try {
    const instructor = await userService.getUserInTenant(Number(id), tenantId);
    
    if (instructor.role !== UserRole.INSTRUCTOR) {
      return res.status(404).json({ error: 'Instructor not found' });
    }

    await instructor.destroy();

    logger.info('userController.deleteInstructor: Success', { correlationId, instructorId: id });
    res.json({ message: 'Instructor deleted successfully' });
  } catch (error: any) {
    logger.error('userController.deleteInstructor: Error', { correlationId, error: error.message });
    res.status(500).json({ error: error.message || 'Failed to delete instructor' });
  }
};
