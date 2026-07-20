import { Request, Response, NextFunction } from 'express';
import * as schoolService from '../services/schoolService';
import logger from '../utils/logger';

/**
 * Middleware to validate that active_school_context is set
 */
export const validateSchoolContext = async (req: Request, res: Response, next: NextFunction) => {
  const logId = req.correlationId || 'unknown';
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    // Skip validation for certain routes that don't require context
    const publicPaths = ['/context/current', '/context/switch', '/context/accessible'];
    if (publicPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    const { user } = await schoolService.getUserSchoolContext(userId);

    if (!user.active_school_context && !user.tenant_id) {
      return res.status(403).json({
        error: 'No active school context',
        code: 'CONTEXT_001'
      });
    }

    // Attach school context to request for downstream use
    req.schoolFilter = { school_id: user.active_school_context || user.tenant_id };
    next();
  } catch (error: any) {
    logger.error(`validateSchoolContext error: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to validate school context', code: 'INTERNAL_ERROR' });
  }
};

/**
 * Middleware to enforce RLS - ensures all queries include school context filter
 * This middleware should be applied after authenticate middleware
 */
export const enforceRLS = async (req: Request, res: Response, next: NextFunction) => {
  const logId = req.correlationId || 'unknown';
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    // Use activeSchoolId from authenticate middleware if available,
    // otherwise fallback to DB query
    let schoolId = req.activeSchoolId;

    if (!schoolId) {
      const { user } = await schoolService.getUserSchoolContext(userId);
      schoolId = user.active_school_context || user.tenant_id;
    }

    if (!schoolId) {
      logger.warn(`RLS enforcement: No school context for userId=${userId} ip=${req.ip}`, {
        correlationId: logId,
      });
      return res.status(403).json({
        error: 'No active school context',
        code: 'CONTEXT_001'
      });
    }

    // Validate the user has access to this school
    const hasAccess = await schoolService.validateSchoolAccess(userId, schoolId);
    if (!hasAccess) {
      logger.warn(`RLS enforcement: Access denied for userId=${userId} schoolId=${schoolId} ip=${req.ip}`, {
        correlationId: logId,
      });
      return res.status(403).json({
        error: 'School access denied',
        code: 'CONTEXT_002'
      });
    }

    // Attach RLS filter to request for use in services/queries
    req.rlsFilter = { school_id: schoolId };
    req.userSchoolId = schoolId;
    next();
  } catch (error: any) {
    logger.error(`enforceRLS error: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to enforce RLS', code: 'INTERNAL_ERROR' });
  }
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      schoolFilter?: { school_id: number };
      rlsFilter?: { school_id: number };
      userSchoolId?: number;
    }
  }
}
