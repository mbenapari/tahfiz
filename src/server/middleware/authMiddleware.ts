import { Request, Response, NextFunction } from 'express';
import * as permissionService from '../services/permissionService';
import * as schoolService from '../services/schoolService';
import * as jwtHelper from '../helper/jwtHelper';
import { BlacklistedToken } from '../model';

// In-memory cache for blacklisted tokens to avoid DB query on every request
const blacklistCache = new Set<string>();
const CACHE_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Syncs the in-memory blacklist with the database.
 */
const syncBlacklist = async () => {
  try {
    const tokens = await BlacklistedToken.findAll({
      attributes: ['token'],
      where: {
        // Only fetch tokens that haven't expired yet
        expires_at: {
          $gt: new Date()
        }
      } as any
    });
    
    blacklistCache.clear();
    tokens.forEach(t => blacklistCache.add(t.token));
  } catch (error) {
    // console.error is used here as logger might not be initialized in this context
    console.error('Error syncing blacklist cache:', error);
  }
};

// Initial sync and periodic refresh
syncBlacklist();
setInterval(syncBlacklist, CACHE_REFRESH_INTERVAL).unref();

/**
 * Manually add a token to the blacklist cache (e.g., during logout).
 */
export const addToBlacklistCache = (token: string) => {
  blacklistCache.add(token);
};

// Extend Request type to include user and school context
declare global {
  namespace Express {
    interface Request {
      user?: jwtHelper.JwtPayload;
      activeSchoolId?: number;
    }
  }
}

/**
 * Middleware to authenticate user via HTTP-only cookie and validate school context.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    // Check if token is blacklisted in cache first
    if (blacklistCache.has(token)) {
      return res.status(401).json({ error: 'Unauthorized: Token has been revoked' });
    }

    const decoded = jwtHelper.verifyToken(token);
    req.user = decoded;

    // Validate School Context Header if present
    // System owner tokens (roleId 0, tenantId 0) are not tied to any school, so skip the check
    const isSystemOwner = decoded.roleId === 0 && decoded.tenantId === 0;
    const schoolContext = isSystemOwner ? undefined : req.headers['x-school-context'];
    if (schoolContext) {
      const schoolId = parseInt(schoolContext as string, 10);
      if (isNaN(schoolId)) {
        return res.status(400).json({ error: 'Invalid X-School-Context header' });
      }

      const hasAccess = await schoolService.validateSchoolAccess(decoded.userId, schoolId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied for the requested school context' });
      }

      // Set active context on request
      req.activeSchoolId = schoolId;
    } else {
      // Fallback to primary tenant ID if header is missing
      req.activeSchoolId = decoded.tenantId;
    }

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
    const logId = req.correlationId || 'N/A';
    const schoolId = req.activeSchoolId;

    const hasAccess = await permissionService.hasPermission(userId, permissionSlug, logId, schoolId);

    if (!hasAccess) {
      return res.status(403).json({ 
        error: 'Forbidden: You do not have permission to perform this action',
        permission: permissionSlug
      });
    }

    next();
  };
};
