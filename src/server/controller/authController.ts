import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { UserRole } from '../model/User';
import { BlacklistedToken } from '../model';
import bcrypt from 'bcrypt';
import * as jwtHelper from '../helper/jwtHelper';
import * as permissionService from '../services/permissionService';
import { addToBlacklistCache } from '../middleware/authMiddleware';
import { bruteForceService } from '../utils/bruteForceService';
import * as apiResponse from '../utils/apiResponse';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

export const register = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  logger.info('authController.register: Entry', { correlationId, email: req.body.email });
  
  try {
    const { firstName, lastName, email, password, phone, role, tenantId } = req.body;

    // Comprehensive Input Validation
    if (!firstName || !email || !password || !role) {
      logger.warn('authController.register: Validation Failure - Missing fields', { correlationId, email });
      return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'First name, email, password, and role are required'));
    }

    if (!EMAIL_REGEX.test(email)) {
      logger.warn('authController.register: Validation Failure - Invalid email', { correlationId, email });
      return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'Invalid email format'));
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      logger.warn('authController.register: Validation Failure - Password too short', { correlationId, email });
      return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`));
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
        logger.warn('authController.register: Validation Failure - Invalid role', { correlationId, role });
        return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'Invalid role specified'));
    }

    // Check if user already exists
    const existingUser = await userService.getUserByEmail(email);
    if (existingUser) {
      logger.warn('authController.register: Duplicate Email', { correlationId, email });
      return res.status(409).json(apiResponse.fail('DUPLICATE_EMAIL', 'Email already registered'));
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
    logger.debug('authController.register: Auth cookie set', { correlationId, userId: userWithTenant.id });

    // Get effective permissions
    const permissions = await permissionService.getEffectivePermissions(userWithTenant.id, correlationId);

    logger.info('authController.register: Success', { correlationId, userId: userWithTenant.id });
    return res.status(201).json(apiResponse.success({
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
    }));
  } catch (error: any) {
    logger.error('authController.register: Unexpected Error', { 
      correlationId, 
      error: error.message, 
      stack: error.stack 
    });
    return res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Failed to register user', {
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }));
  }
};

export const login = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  logger.info('authController.login: Entry', { correlationId, email: req.body.email });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn('authController.login: Validation Failure - Missing credentials', { correlationId });
      return res.status(400).json(apiResponse.fail('VALIDATION_ERROR', 'Email and password are required'));
    }

    // Brute-force protection check
    const lockout = bruteForceService.isLockedOut(email);
    if (lockout.locked) {
      const minutes = Math.ceil(lockout.remainingMs / 60000);
      return res.status(429).json(apiResponse.fail('RATE_LIMIT_EXCEEDED', `Account is temporarily locked due to too many failed attempts. Please try again in ${minutes} minutes.`));
    }

    // Generic error message for security
    const INVALID_CREDENTIALS_MSG = 'Invalid credentials';

    const user = await userService.getUserByEmail(email); 

    // Timing attack mitigation: if user not found, do a dummy bcrypt check
    if (!user) {
       await bcrypt.hash(password, 12); 
       bruteForceService.recordFailedAttempt(email);
       logger.warn('authController.login: User not found', { correlationId, email });
       return res.status(401).json(apiResponse.fail('AUTH_FAILED', INVALID_CREDENTIALS_MSG));
    }

    // Verify password using the instance method which uses bcrypt.compare
    const isPasswordValid = await user.validatePassword(password);
    if (!isPasswordValid) {
      bruteForceService.recordFailedAttempt(email);
      logger.warn('authController.login: Invalid Password', { correlationId, userId: user.id, email });
      return res.status(401).json(apiResponse.fail('AUTH_FAILED', INVALID_CREDENTIALS_MSG));
    }

    // Reset brute-force attempts on successful login
    bruteForceService.resetAttempts(email);

    const token = jwtHelper.signToken({
      userId: user.id,
      roleId: user.role_id,
      tenantId: user.tenant_id,
    });

    jwtHelper.setAuthCookie(res, token);
    logger.debug('authController.login: Auth cookie set', { correlationId, userId: user.id });

    // Get effective permissions
    const permissions = await permissionService.getEffectivePermissions(user.id);

    logger.info('authController.login: Success', { correlationId, userId: user.id });
    return res.json(apiResponse.success({
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
    }));
  } catch (error: any) {
    logger.error('authController.login: Unexpected Error', { 
      correlationId, 
      error: error.message, 
      stack: error.stack 
    });
    return res.status(500).json(apiResponse.fail('SERVER_ERROR', 'Login failed'));
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

      // Immediate cache invalidation
      addToBlacklistCache(token);

      logger.info('authController.logout: Token blacklisted', { correlationId });
    } catch (error: any) {
      logger.error('authController.logout: Error blacklisting token', { correlationId, error: error.message });
      // Continue with clearing cookie even if blacklisting fails
    }
  }

  res.clearCookie('jwt');
  res.json(apiResponse.success({ message: 'Logged out successfully' }));
};
