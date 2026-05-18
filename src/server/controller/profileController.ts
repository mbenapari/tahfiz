import { Request, Response } from 'express';
import * as userService from '../services/userService';
import * as permissionService from '../services/permissionService';
import * as apiResponse from '../utils/apiResponse';
import logger from '../utils/logger';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const getCurrentUser = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const userId = req.user?.userId;

  if (!userId) {
    logger.warn('profileController.getCurrentUser: No user ID in request', { correlationId });
    return res.status(401).json(apiResponse.fail('UNAUTHORIZED', 'Unauthorized'));
  }

  try {
    const user = await userService.getUserById(userId);
    const permissions = await permissionService.getEffectivePermissions(userId, correlationId);

    logger.debug('profileController.getCurrentUser: Success', { correlationId, userId });
    return res.json(apiResponse.success({
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
    }));
  } catch (error: any) {
    logger.error('profileController.getCurrentUser: Error', { correlationId, userId, error: error.message });
    return res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to fetch user profile'));
  }
};

export const updateCurrentUser = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json(apiResponse.fail('UNAUTHORIZED', 'Unauthorized'));
  }

  try {
    const { firstName, lastName, email, phone, password } = req.body;

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

    logger.info('profileController.updateCurrentUser: Success', { correlationId, userId });
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
    logger.error('profileController.updateCurrentUser: Error', { correlationId, userId, error: error.message });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to update profile'));
  }
};

export const completeOnboarding = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const userId = req.user?.userId;

  if (!userId) {
    return res.status(401).json(apiResponse.fail('UNAUTHORIZED', 'Unauthorized'));
  }

  try {
    const user = await userService.getUserById(userId);
    user.is_onboarded = true;
    await user.save();

    logger.info('profileController.completeOnboarding: Success', { correlationId, userId });
    res.json(apiResponse.success({ message: 'Onboarding completed successfully' }));
  } catch (error: any) {
    logger.error('profileController.completeOnboarding: Error', { correlationId, userId, error: error.message });
    res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to complete onboarding'));
  }
};
