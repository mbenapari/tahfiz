import { Request, Response, NextFunction } from 'express';
import * as permissionService from '../services/permissionService';
import * as jwtHelper from '../helper/jwtHelper';

// Extend Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: jwtHelper.JwtPayload;
    }
  }
}

/**
 * Middleware to authenticate user via HTTP-only cookie.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const decoded = jwtHelper.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Middleware to check if the authenticated user has a specific permission.
 * Uses req.user set by the authenticate middleware.
 */
export const checkPermission = (permissionSlug: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    const userId = req.user.userId;

    const hasAccess = await permissionService.hasPermission(userId, permissionSlug);

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Forbidden: You do not have permission to perform this action',
        permission: permissionSlug
      });
    }

    next();
  };
};
