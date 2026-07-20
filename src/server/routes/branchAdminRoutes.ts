import { Router } from 'express';
import * as schoolService from '../services/schoolService';
import { authenticate } from '../middleware/authMiddleware';
import { branchAdminChangeLimiter } from '../middleware/rateLimitMiddleware';
import { User } from '../model';
import { UserRole } from '../model/User';
import logger from '../utils/logger';

const router = Router();

// Middleware to check if user is parent school admin
const requireParentSchoolAdmin = async (req: any, res: any, next: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const userId = req.user?.userId;
    const parentSchoolId = parseInt(req.params.parentSchoolId || req.body.parentSchoolId);

    if (!userId || !parentSchoolId) {
      return res.status(400).json({ error: 'Missing required parameters', code: 'INVALID_REQUEST' });
    }

    const school = await schoolService.getSchoolById(parentSchoolId);
    if (school.owner_id !== userId) {
      logger.warn(`Unauthorized branch admin access attempt: userId=${userId} parentSchoolId=${parentSchoolId} ip=${req.ip}`, {
        correlationId: logId,
      });
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }

    req.parentSchool = school;
    next();
  } catch (error: any) {
    logger.error(`Error in requireParentSchoolAdmin: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

/**
 * POST /api/branch-admins/grant
 * Grant branch admin access
 */
router.post('/grant', authenticate, branchAdminChangeLimiter, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const userId = req.user?.userId;
    const { parentSchoolId, targetUserId, branchId, isPrimaryAdmin } = req.body;

    if (!userId || !parentSchoolId || !targetUserId || !branchId) {
      return res.status(400).json({ error: 'Missing required parameters', code: 'INVALID_REQUEST' });
    }

    // Verify the requesting user is the parent school admin
    const school = await schoolService.getSchoolById(parentSchoolId);
    if (school.owner_id !== userId) {
      logger.warn(`Unauthorized branch admin grant attempt: userId=${userId} parentSchoolId=${parentSchoolId} ip=${req.ip}`, {
        correlationId: logId,
      });
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }

    const membership = await schoolService.grantBranchAdminAccess(
      parentSchoolId,
      targetUserId,
      branchId,
      userId,
      isPrimaryAdmin || false,
      logId
    );

    logger.info(`Branch admin access granted: userId=${targetUserId} branchId=${branchId} grantedBy=${userId}`, {
      correlationId: logId,
      action: 'BRANCH_ADMIN_GRANTED',
    });

    return res.status(201).json({
      message: 'Branch admin access granted successfully',
      membership,
    });
  } catch (error: any) {
    logger.error(`Failed to grant branch admin access: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });

    if (error.code === 'ADMIN_002') {
      return res.status(409).json({ error: error.message, code: error.code });
    }
    if (error.code === 'BRANCH_002') {
      return res.status(404).json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: 'Failed to grant branch admin access', code: 'INTERNAL_ERROR' });
  }
});

/**
 * DELETE /api/branch-admins/revoke/:userId/:branchId
 * Revoke branch admin access
 */
router.delete('/revoke/:userId/:branchId', authenticate, branchAdminChangeLimiter, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const userId = req.user?.userId;
    const targetUserId = parseInt(req.params.userId);
    const branchId = parseInt(req.params.branchId);

    if (!userId || !targetUserId || !branchId) {
      return res.status(400).json({ error: 'Missing required parameters', code: 'INVALID_REQUEST' });
    }

    // Get branch and verify parent school ownership
    const branch = await schoolService.getBranchById(branchId);
    const parentSchool = await schoolService.getSchoolById(branch.parent_school_id!);

    if (parentSchool.owner_id !== userId) {
      logger.warn(`Unauthorized branch admin revoke attempt: userId=${userId} targetUserId=${targetUserId} branchId=${branchId} ip=${req.ip}`, {
        correlationId: logId,
      });
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }

    await schoolService.revokeBranchAdminAccess(branchId, targetUserId, logId);

    logger.info(`Branch admin access revoked: userId=${targetUserId} branchId=${branchId} revokedBy=${userId}`, {
      correlationId: logId,
      action: 'BRANCH_ADMIN_REVOKED',
    });

    return res.json({ message: 'Branch admin access revoked successfully' });
  } catch (error: any) {
    logger.error(`Failed to revoke branch admin access: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });

    if (error.code === 'ADMIN_001') {
      return res.status(404).json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: 'Failed to revoke branch admin access', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/branch-admins/branch/:branchId
 * List branch admins
 */
router.get('/branch/:branchId', authenticate, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const userId = req.user?.userId;
    const branchId = parseInt(req.params.branchId);

    if (!userId || !branchId) {
      return res.status(400).json({ error: 'Missing required parameters', code: 'INVALID_REQUEST' });
    }

    // Verify access
    const hasAccess = await schoolService.validateSchoolAccess(userId, branchId);
    if (!hasAccess) {
      logger.warn(`Unauthorized branch admin list attempt: userId=${userId} branchId=${branchId} ip=${req.ip}`, {
        correlationId: logId,
      });
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }

    const admins = await schoolService.getBranchAdmins(branchId);

    return res.json({
      admins: admins.map(admin => ({
        id: admin.id,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        role: admin.role,
      })),
    });
  } catch (error: any) {
    logger.error(`Failed to list branch admins: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to list branch admins', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/branch-admins/user/:userId
 * Get user's branch admin roles
 */
router.get('/user/:userId', authenticate, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const requestingUserId = req.user?.userId;
    const targetUserId = parseInt(req.params.userId);

    if (!requestingUserId || !targetUserId) {
      return res.status(400).json({ error: 'Missing required parameters', code: 'INVALID_REQUEST' });
    }

    // Users can view their own branch admin roles, or parent school admins can view their branches' admins
    if (requestingUserId !== targetUserId) {
      // Check if requesting user is a parent school admin
      const user = await User.findByPk(requestingUserId);
      if (!user || user.role !== UserRole.ADMIN) {
        return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
      }
    }

    // Get all admin memberships for the user that are branch-scoped
    const { SchoolMember, School } = require('../model');
    const memberships = await SchoolMember.findAll({
      where: { user_id: targetUserId, role: UserRole.ADMIN, scope_type: 'branch' },
      include: [{ model: School, as: 'school' }],
    });

    const branchRoles = memberships.map((m: any) => ({
      school_id: m.school_id,
      school_name: m.school?.name,
      is_primary_admin: m.is_primary_admin,
      granted_at: m.granted_at,
      granted_by_user_id: m.granted_by_user_id,
    }));

    return res.json({ branchRoles });
  } catch (error: any) {
    logger.error(`Failed to get user branch admin roles: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to get branch admin roles', code: 'INTERNAL_ERROR' });
  }
});

export default router;
