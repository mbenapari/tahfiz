import { Router } from 'express';
import * as schoolService from '../services/schoolService';
import { authenticate } from '../middleware/authMiddleware';
import { branchCreationLimiter } from '../middleware/rateLimitMiddleware';
import { School, User } from '../model';
import { UserRole } from '../model/User';
import logger from '../utils/logger';

const router = Router();

// Middleware to check if user is a parent school admin
const requireParentSchoolAccess = async (req: any, res: any, next: any) => {
  const logId = req.correlationId || 'unknown';
  const userId = req.user?.userId;
  const parentSchoolId = parseInt(req.params.parentSchoolId || req.body.parentSchoolId || req.query.parentSchoolId);
  const routePath = req.originalUrl || req.path;

  logger.info(`requireParentSchoolAccess: Checking parent school access for route=${routePath}`, {
    correlationId: logId,
    userId,
    parentSchoolId,
    ip: req.ip,
  });

  try {
    if (!userId || !parentSchoolId) {
      logger.warn(`requireParentSchoolAccess: Missing parameters for route=${routePath}`, {
        correlationId: logId,
        hasUserId: !!userId,
        hasParentSchoolId: !!parentSchoolId,
        bodyKeys: req.body ? Object.keys(req.body) : [],
        paramsKeys: req.params ? Object.keys(req.params) : [],
        queryKeys: req.query ? Object.keys(req.query) : [],
        ip: req.ip,
      });
      return res.status(400).json({ error: 'Missing required parameters', code: 'INVALID_REQUEST' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      logger.warn(`requireParentSchoolAccess: User not found userId=${userId}`, {
        correlationId: logId,
        userId,
        parentSchoolId,
        ip: req.ip,
      });
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    // Check if user is admin and owns the parent school
    const school = await schoolService.getSchoolById(parentSchoolId);
    if (school.owner_id !== userId) {
      logger.warn(`requireParentSchoolAccess: Access denied — user does not own the parent school`, {
        correlationId: logId,
        userId,
        parentSchoolId,
        schoolOwnerId: school.owner_id,
        userRole: user.role,
        ip: req.ip,
        routePath,
      });
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }

    logger.info(`requireParentSchoolAccess: Access granted for parent school`, {
      correlationId: logId,
      userId,
      parentSchoolId,
      schoolName: school.name,
      userRole: user.role,
      ip: req.ip,
      routePath,
    });

    req.parentSchool = school;
    next();
  } catch (error: any) {
    logger.error(`requireParentSchoolAccess: Unexpected error`, {
      correlationId: logId,
      userId,
      parentSchoolId,
      routePath,
      error: error.message,
      code: error.code,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

// Middleware to check if user has branch access
const requireBranchAccess = async (req: any, res: any, next: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const userId = req.user?.userId;
    const branchId = parseInt(req.params.branchId || req.body.branchId);

    if (!userId || !branchId) {
      return res.status(400).json({ error: 'Missing required parameters', code: 'INVALID_REQUEST' });
    }

    const hasAccess = await schoolService.validateSchoolAccess(userId, branchId);
    if (!hasAccess) {
      logger.warn(`Unauthorized branch access attempt: userId=${userId} targetBranchId=${branchId} ip=${req.ip}`, {
        correlationId: logId,
      });
      return res.status(403).json({ error: 'Access denied', code: 'ACCESS_DENIED' });
    }

    next();
  } catch (error: any) {
    logger.error(`Error in requireBranchAccess: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
  }
};

/**
 * POST /api/branches
 * Create a new branch under a parent school
 */
router.post('/', authenticate, branchCreationLimiter, requireParentSchoolAccess, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const { name, slug, branchCode, timezone, studyDays, scheduleMode, sessionTypeDayMap, enabledMemorizationSubtypes, address, email, phone } = req.body;
    const parentSchoolId = req.parentSchool.id;

    if (!name || !slug || !branchCode) {
      return res.status(400).json({ error: 'Name, slug, and branch code are required', code: 'BRANCH_001' });
    }

    const branchData: schoolService.CreateBranchDTO = {
      name,
      slug,
      branchCode,
      owner_id: req.user?.userId,
      timezone,
      study_days: studyDays,
      schedule_mode: scheduleMode,
      session_type_day_map: sessionTypeDayMap,
      enabled_memorization_subtypes: enabledMemorizationSubtypes,
      address,
      email,
      phone,
    };

    const branch = await schoolService.createBranchSchool(parentSchoolId, branchData, logId);

    return res.status(201).json({
      message: 'Branch created successfully',
      branch,
    });
  } catch (error: any) {
    logger.error(`Failed to create branch: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });

    if (error.code) {
      return res.status(error.code === 'BRANCH_003' ? 409 : 400).json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: 'Failed to create branch', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/branches
 * List accessible branches (for parent school admin)
 */
router.get('/', authenticate, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const userId = req.user?.userId;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });
    }

    let branches;
    if (user.role === UserRole.ADMIN && user.tenant_id) {
      // Get branches for the user's parent school
      branches = await schoolService.getBranchesForParentSchool(user.tenant_id);
    } else {
      // Get accessible schools and filter to branches
      const accessibleSchools = await schoolService.getAccessibleSchools(userId);
      branches = accessibleSchools.filter(s => s.is_branch);
    }

    return res.json({ branches });
  } catch (error: any) {
    logger.error(`Failed to list branches: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to list branches', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/branches/:branchId
 * Get branch details
 */
router.get('/:branchId', authenticate, requireBranchAccess, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const branchId = parseInt(req.params.branchId);
    const branch = await schoolService.getBranchById(branchId);

    // Get parent school info if available
    let parentSchool = null;
    if (branch.parent_school_id) {
      parentSchool = await schoolService.getSchoolById(branch.parent_school_id);
    }

    return res.json({ branch, parentSchool });
  } catch (error: any) {
    logger.error(`Failed to get branch: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });

    if (error.code === 'BRANCH_002') {
      return res.status(404).json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: 'Failed to get branch', code: 'INTERNAL_ERROR' });
  }
});

/**
 * PUT /api/branches/:branchId
 * Update branch settings
 */
router.put('/:branchId', authenticate, requireBranchAccess, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const branchId = parseInt(req.params.branchId);
    const { name, timezone, studyDays, scheduleMode, sessionTypeDayMap, enabledMemorizationSubtypes, address, email, phone, isActive } = req.body;

    const updateData: schoolService.UpdateBranchDTO = {
      name,
      timezone,
      study_days: studyDays,
      schedule_mode: scheduleMode,
      session_type_day_map: sessionTypeDayMap,
      enabled_memorization_subtypes: enabledMemorizationSubtypes,
      address,
      email,
      phone,
      is_active: isActive,
    };

    const branch = await schoolService.updateBranchSettings(branchId, updateData, logId);

    return res.json({
      message: 'Branch updated successfully',
      branch,
    });
  } catch (error: any) {
    logger.error(`Failed to update branch: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });

    if (error.code) {
      return res.status(400).json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: 'Failed to update branch', code: 'INTERNAL_ERROR' });
  }
});

/**
 * PATCH /api/branches/:branchId/status
 * Activate/deactivate branch
 */
router.patch('/:branchId/status', authenticate, requireBranchAccess, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const branchId = parseInt(req.params.branchId);
    const { isActive, reason } = req.body;

    let result;
    if (isActive) {
      result = await schoolService.reactivateBranch(branchId, logId);
    } else {
      await schoolService.deactivateBranch(branchId, reason || 'Manual deactivation', logId);
      result = true;
    }

    return res.json({
      message: isActive ? 'Branch reactivated successfully' : 'Branch deactivated successfully',
      result,
    });
  } catch (error: any) {
    logger.error(`Failed to update branch status: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });

    if (error.code === 'BRANCH_005') {
      return res.status(400).json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: 'Failed to update branch status', code: 'INTERNAL_ERROR' });
  }
});

/**
 * DELETE /api/branches/:branchId
 * Soft delete branch
 */
router.delete('/:branchId', authenticate, requireBranchAccess, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const branchId = parseInt(req.params.branchId);

    // Only parent school admin can delete
    const userId = req.user?.userId;
    const branch = await schoolService.getBranchById(branchId);
    const parentSchool = await schoolService.getSchoolById(branch.parent_school_id!);

    if (parentSchool.owner_id !== userId) {
      logger.warn(`Unauthorized branch delete attempt: userId=${userId} branchId=${branchId} ip=${req.ip}`, {
        correlationId: logId,
      });
      return res.status(403).json({ error: 'Only parent school admin can delete branches', code: 'ACCESS_DENIED' });
    }

    await schoolService.deleteSchool(branchId);

    return res.json({ message: 'Branch deleted successfully' });
  } catch (error: any) {
    logger.error(`Failed to delete branch: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to delete branch', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/branches/:branchId/members
 * List branch members
 */
router.get('/:branchId/members', authenticate, requireBranchAccess, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const branchId = parseInt(req.params.branchId);
    const members = await schoolService.getSchoolMembers(branchId);

    return res.json({ members });
  } catch (error: any) {
    logger.error(`Failed to list branch members: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to list members', code: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/branches/:branchId/members
 * Add member to branch
 */
router.post('/:branchId/members', authenticate, requireBranchAccess, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const branchId = parseInt(req.params.branchId);
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({ error: 'userId and role are required', code: 'INVALID_REQUEST' });
    }

    const member = await schoolService.addSchoolMember(branchId, userId, role, req.user?.userId);

    return res.status(201).json({
      message: 'Member added successfully',
      member,
    });
  } catch (error: any) {
    logger.error(`Failed to add branch member: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to add member', code: 'INTERNAL_ERROR' });
  }
});

/**
 * DELETE /api/branches/:branchId/members/:userId
 * Remove member from branch
 */
router.delete('/:branchId/members/:userId', authenticate, requireBranchAccess, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const branchId = parseInt(req.params.branchId);
    const userId = parseInt(req.params.userId);

    const result = await schoolService.removeSchoolMember(branchId, userId);

    if (!result) {
      return res.status(404).json({ error: 'Member not found', code: 'MEMBER_NOT_FOUND' });
    }

    return res.json({ message: 'Member removed successfully' });
  } catch (error: any) {
    logger.error(`Failed to remove branch member: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to remove member', code: 'INTERNAL_ERROR' });
  }
});

export default router;
