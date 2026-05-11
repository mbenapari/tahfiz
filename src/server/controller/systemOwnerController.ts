import { Request, Response } from 'express';
import * as authService from '../services/systemOwnerAuthService';
import logger from '../utils/logger';

export const login = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  logger.info('systemOwnerController.login: Entry', { correlationId, email: req.body.email });
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { owner, token } = await authService.loginSystemOwner(email, password, res);

    return res.json({ 
      message: 'Login successful', 
      user: {
        id: owner.id,
        email: owner.email,
        name: owner.name,
        role: 'owner'
      }, 
      token 
    });
  } catch (error: any) {
    logger.warn('systemOwnerController.login: Failed', { correlationId, error: error.message });
    return res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
};

export const logout = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const token = req.cookies.jwt;
  try {
    await authService.logoutSystemOwner(token, res);
    return res.json({ message: 'Logged out' });
  } catch (error: any) {
    logger.error('systemOwnerController.logout: Error', { correlationId, error: error.message });
    return res.status(500).json({ error: 'Logout failed' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  // For now, read info from token if present — token payload uses userId
  try {
    if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
    // Could fetch owner by id if needed
    return res.json({ user: { id: req.user.userId, role: 'owner' } });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch owner' });
  }
};

export default {
  login,
  logout,
  getMe
};
