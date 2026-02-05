import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { UserRole } from '../model/User';
import * as jwtHelper from '../helper/jwtHelper';
import * as permissionService from '../services/permissionService';
import logger from '../utils/logger';

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
    
    // Auto-login: Generate Token and Set Cookie
    const token = jwtHelper.signToken({
      userId: newUser.id,
      roleId: newUser.role_id,
      tenantId: newUser.tenant_id,
    });
    
    jwtHelper.setAuthCookie(res, token);
    logger.debug('userController.register: Auth cookie set', { correlationId, userId: newUser.id });

    // Get effective permissions
    const permissions = await permissionService.getEffectivePermissions(newUser.id);

    logger.info('userController.register: Success', { correlationId, userId: newUser.id });
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        role: newUser.role,
        tenant_id: newUser.tenant_id,
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
        tenant_id: user.tenant_id,
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

export const logout = (req: Request, res: Response) => {
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
        role: user.role,
        tenant_id: user.tenant_id,
        permissions
      }
    });
  } catch (error: any) {
    logger.error('userController.getCurrentUser: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
