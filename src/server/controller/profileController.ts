import { Request, Response } from 'express';
import * as userService from '../services/userService';
import * as permissionService from '../services/permissionService';
import { UserRole } from '../model/User';
import * as apiResponse from '../utils/apiResponse';
import logger from '../utils/logger';
import * as schoolService from '../services/schoolService';
import { getTenantId } from '../utils/schoolContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?[0-9]{7,15}$/;

export const getCurrentUser = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const userId = req.user?.userId;

  if (!userId) {
    logger.warn(`profileController: getCurrentUser - No user ID in request`, { logId });
    return res.status(401).json(apiResponse.fail('UNAUTHORIZED', 'Unauthorized'));
  }

  try {
    const user = await userService.getUserById(userId);
    const active_school_context = user.active_school_context || user.tenant_id;
    logger.info(`profileController: getCurrentUser - Fetching profile for userId: ${userId}, context: ${active_school_context}`, {
      logId,
      userId,
      active_school_context
    });
    const permissions = await permissionService.getEffectivePermissions(userId, active_school_context, logId);
    const schools = await schoolService.getAccessibleSchools(userId);

    return res.json(apiResponse.success({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        tenantId: user.tenant_id,
        active_school_context,
        schools,
        is_onboarded: Boolean(user.is_onboarded),
        school_name: user.tenant?.name,
        permissions
      }
    }));
  } catch (error: any) {
    logger.error(`profileController: getCurrentUser - Error: ${error.message}`, { logId, userId });
    return res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to fetch user profile'));
  }
};

export const updateCurrentUser = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json(apiResponse.fail('UNAUTHORIZED', 'Unauthorized'));
  }

  try {
    const { firstName, lastName, email, phone, password } = req.body;
    logger.info(`profileController: updateCurrentUser - Updating profile for userId: ${userId}`, { logId, userId });

    // Validate email if provided
    if (email && !EMAIL_REGEX.test(email)) {
      return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'Invalid email format'));
    }

    // Check if email is taken by another user
    if (email) {
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser && existingUser.id !== userId) {
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

    const updatedUser = await userService.updateUser(userId, updateData);

    logger.info(`profileController: updateCurrentUser - Success for userId: ${userId}`, { logId, userId });
    res.json(apiResponse.success({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        email: updatedUser.email,
        role: updatedUser.role,
        tenantId: updatedUser.tenant_id,
      }
    }));
  } catch (error: any) {
    logger.error(`profileController: updateCurrentUser - Error: ${error.message}`, { logId, userId });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to update profile'));
  }
};

export const completeOnboarding = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json(apiResponse.fail('UNAUTHORIZED', 'Unauthorized'));
  }

  try {
    logger.info(`profileController: completeOnboarding - Completing onboarding for userId: ${userId}`, { logId, userId });
    const user = await userService.getUserById(userId);
    user.is_onboarded = true;
    await user.save();

    res.json(apiResponse.success({ message: 'Onboarding completed successfully' }));
  } catch (error: any) {
    logger.error(`profileController: completeOnboarding - Error: ${error.message}`, { logId, userId });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to complete onboarding'));
  }
};

// Search users by name/email/phone for admin member selection
export const searchUsers = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const query = req.query.query as string;
  const excludeRoles = req.query.excludeRoles ? (req.query.excludeRoles as string).split(',') : undefined;

  if (!query || query.length < 2) {
    return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'Search query must be at least 2 characters'));
  }

  try {
    const tenantId = getTenantId(req);
    logger.info(`profileController: searchUsers - query: "${query}", tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const users = await userService.searchUsers(query, tenantId, excludeRoles);

    const results = users.map(u => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
    }));

    logger.info(`profileController: searchUsers - Success: returning ${results.length} results`, { logId });
    res.json(apiResponse.success({ users: results }));
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`profileController: searchUsers - Error: ${error.message}`, { logId });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to search users'));
  }
};

// List users by role for dropdown selection
export const listUsersByRole = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const role = req.params.role as string;

  const validRoles = [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT];
  if (!validRoles.includes(role as UserRole)) {
    return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', `Invalid role. Must be one of: ${validRoles.join(', ')}`));
  }

  try {
    const tenantId = getTenantId(req);
    logger.info(`profileController: listUsersByRole - role: ${role}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });

    const users = await userService.getUsersByRole(tenantId, role as UserRole);

    const results = users.map(u => ({
      id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
    }));

    logger.info(`profileController: listUsersByRole - Success: returning ${results.length} results`, { logId });
    res.json(apiResponse.success({ users: results }));
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`profileController: listUsersByRole - Error: ${error.message}`, { logId });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to list users'));
  }
};

// Admin-initiated user creation (no password required)
export const createUser = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { firstName, lastName, email, phone, role } = req.body;

  if (!firstName || !role) {
    return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'First name and role are required'));
  }

  // Validate role
  const validRoles = [UserRole.ADMIN, UserRole.INSTRUCTOR, UserRole.STUDENT];
  if (!validRoles.includes(role)) {
    return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', `Invalid role. Must be one of: ${validRoles.join(', ')}`));
  }

  // Validate email format if provided
  if (email && !EMAIL_REGEX.test(email)) {
    return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'Invalid email format'));
  }

  // Validate phone format if provided
  if (phone && !PHONE_REGEX.test(phone)) {
    return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'Invalid phone number format'));
  }

  try {
    const tenantId = getTenantId(req);
    logger.info(`profileController: createUser - Creating user with role: ${role}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });

    // Check for duplicate email if provided
    if (email) {
      const existingUser = await userService.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json(apiResponse.fail('DUPLICATE_EMAIL', 'A user with this email already exists'));
      }
    }

    const userData: userService.CreateUserDTO = {
      tenant_id: tenantId,
      first_name: firstName,
      last_name: lastName || '',
      email: email || undefined,
      phone: phone || undefined,
      role,
    };

    const newUser = await userService.createUser(userData);

    logger.info(`profileController: createUser - Success: newUserId: ${newUser.id}`, { logId });
    res.status(201).json(apiResponse.success({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
      },
    }));
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`profileController: createUser - Error: ${error.message}`, { logId });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to create user'));
  }
};
