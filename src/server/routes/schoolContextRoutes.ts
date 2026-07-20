import { Router } from 'express';
import * as schoolService from '../services/schoolService';
import { authenticate } from '../middleware/authMiddleware';
import { contextSwitchLimiter } from '../middleware/rateLimitMiddleware';
import { User } from '../model';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /api/context/current
 * Get current school context
 */
router.get('/current', authenticate, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const { user, school } = await schoolService.getUserSchoolContext(userId);

    return res.json({
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        active_school_context: user.active_school_context,
        tenant_id: user.tenant_id,
      },
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
        is_branch: school.is_branch,
        parent_school_id: school.parent_school_id,
        is_active: school.is_active,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to get current context: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to get current context', code: 'INTERNAL_ERROR' });
  }
});

/**
 * POST /api/context/switch/:schoolId
 * Switch active school context
 */
router.post('/switch/:schoolId', authenticate, contextSwitchLimiter, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const userId = req.user?.userId;
    const schoolId = parseInt(req.params.schoolId);

    if (!userId || !schoolId) {
      return res.status(400).json({ error: 'Missing required parameters', code: 'INVALID_REQUEST' });
    }

    const user = await schoolService.switchSchoolContext(userId, schoolId, logId);

    // Get updated context
    const { school } = await schoolService.getUserSchoolContext(userId);

    logger.info(`Context switched: userId=${userId} toSchoolId=${schoolId}`, {
      correlationId: logId,
      action: 'CONTEXT_SWITCHED',
    });

    return res.json({
      message: 'Context switched successfully',
      user: {
        id: user.id,
        active_school_context: user.active_school_context,
      },
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
        is_branch: school.is_branch,
      },
    });
  } catch (error: any) {
    logger.error(`Failed to switch context: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });

    if (error.code === 'CONTEXT_002') {
      return res.status(403).json({ error: error.message, code: error.code });
    }
    if (error.code === 'CONTEXT_003') {
      return res.status(400).json({ error: error.message, code: error.code });
    }
    return res.status(500).json({ error: 'Failed to switch context', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/context/accessible
 * List all accessible schools
 */
router.get('/accessible', authenticate, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const schools = await schoolService.getAccessibleSchools(userId);

    return res.json({
      schools: schools.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        is_branch: s.is_branch,
        parent_school_id: s.parent_school_id,
        branch_code: s.branch_code,
        is_active: s.is_active,
      })),
    });
  } catch (error: any) {
    logger.error(`Failed to get accessible schools: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to get accessible schools', code: 'INTERNAL_ERROR' });
  }
});

/**
 * GET /api/context/accessible/tree
 * Get school hierarchy tree
 */
router.get('/accessible/tree', authenticate, async (req: any, res: any) => {
  const logId = req.correlationId || 'unknown';
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
    }

    const schools = await schoolService.getAccessibleSchools(userId);

    // Separate parent schools and branches
    const parentSchools = schools.filter(s => !s.is_branch);
    const branches = schools.filter(s => s.is_branch);

    // Build tree structure
    const tree = parentSchools.map(parent => ({
      ...parent,
      branches: branches
        .filter(b => b.parent_school_id === parent.id)
        .map(b => b),
    }));

    return res.json({ tree });
  } catch (error: any) {
    logger.error(`Failed to get school tree: error=${error.message}`, {
      correlationId: logId,
      stack: error.stack,
    });
    return res.status(500).json({ error: 'Failed to get school hierarchy', code: 'INTERNAL_ERROR' });
  }
});

export default router;
