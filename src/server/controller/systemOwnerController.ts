import { Request, Response } from 'express';
import * as authService from '../services/systemOwnerAuthService';
import * as apiResponse from '../utils/apiResponse';
import logger from '../utils/logger';

export const login = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  logger.info('systemOwnerController.login: Entry', { correlationId, email: req.body.email });
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'Email and password required'));

    const { owner, token } = await authService.loginSystemOwner(email, password, res);

    return res.json(apiResponse.success({ 
      message: 'Login successful', 
      user: {
        id: owner.id,
        email: owner.email,
        name: owner.name,
        role: 'owner'
      }, 
      token 
    }));
  } catch (error: any) {
    logger.warn('systemOwnerController.login: Failed', { correlationId, error: error.message });
    return res.status(401).json(apiResponse.fail('AUTH_FAILED', error.message || 'Invalid credentials'));
  }
};

export const logout = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const token = req.cookies.jwt;
  try {
    await authService.logoutSystemOwner(token, res);
    return res.json(apiResponse.success({ message: 'Logged out' }));
  } catch (error: any) {
    logger.error('systemOwnerController.logout: Error', { correlationId, error: error.message });
    return res.status(500).json(apiResponse.fail('LOGOUT_FAILED', 'Logout failed'));
  }
};

export const getMe = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  // For now, read info from token if present — token payload uses userId
  try {
    if (!req.user) return res.status(401).json(apiResponse.fail('UNAUTHORIZED', 'Not authenticated'));
    // Could fetch owner by id if needed
    return res.json(apiResponse.success({ 
      user: { 
        id: req.user.userId, 
        role: 'owner',
        is_onboarded: true // System owners are always onboarded
      } 
    }));
  } catch (error: any) {
    logger.error('systemOwnerController.getMe: Error', { correlationId, error: error.message });
    return res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to fetch owner'));
  }
};

export default {
  login,
  logout,
  getMe
};
