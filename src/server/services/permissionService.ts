import { User, Role, Permission, UserPermission, RolePermission, SchoolMember } from '../model';
import { PermissionAccess } from '../model/UserPermission';
import { UserRole } from '../model/User';
import logger from '../utils/logger';

const PERMISSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const permissionCache = new Map<string, CacheEntry>();

const cacheGet = (key: string): unknown | null => {
  const entry = permissionCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    permissionCache.delete(key);
    return null;
  }
  return entry.data;
};

const cacheSet = (key: string, data: unknown, ttlMs: number = PERMISSION_CACHE_TTL_MS): void => {
  permissionCache.set(key, { data, expiresAt: Date.now() + ttlMs });
};

const cacheInvalidate = (userId: number): void => {
  const prefix = `user:${userId}:`;
  for (const key of permissionCache.keys()) {
    if (key.startsWith(prefix)) {
      permissionCache.delete(key);
    }
  }
};

/**
 * Checks if a user has a specific permission, optionally scoped to a school context.
 */
export const hasPermission = async (
  userId: number,
  permissionSlug: string,
  logId: string = 'N/A',
  schoolId?: number
): Promise<boolean> => {
  const cacheKey = `perm:${userId}:${permissionSlug}:${schoolId || 'global'}`;
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached as boolean;

  try {
    // 1. Check User Overrides (Global for now)
    const override = await UserPermission.findOne({
      where: { user_id: userId },
      include: [{
        model: Permission,
        where: { slug: permissionSlug },
        required: true
      }]
    });

    if (override) {
      const result = override.access_type === PermissionAccess.ALLOW;
      cacheSet(cacheKey, result);
      return result;
    }

    // 2. Resolve Role for Context
    let roleSlug: string | undefined;

    if (schoolId) {
      const membership = await SchoolMember.findOne({
        where: { user_id: userId, school_id: schoolId }
      });
      if (membership) {
        roleSlug = membership.role;
      }
    }

    if (!roleSlug) {
      const user = await User.findByPk(userId);
      roleSlug = user?.role;
    }

    if (!roleSlug) return false;

    // 3. Check Role Defaults
    const role = await Role.findOne({
      where: { slug: roleSlug },
      include: [{
        model: Permission,
        as: 'permissions',
        where: { slug: permissionSlug },
        required: true
      }]
    });

    const result = !!role;
    cacheSet(cacheKey, result);
    return result;
  } catch (error: any) {
    logger.error(`permissionService.hasPermission error: userId=${userId} schoolId=${schoolId} slug=${permissionSlug} error=${error.message}`);
    return false;
  }
};

/**
 * Gets all effective permissions for a user, optionally scoped to a school context.
 */
export const getEffectivePermissions = async (
  userId: number,
  schoolId?: number | string,
  logId: string = 'N/A'
): Promise<string[]> => {
  // Handle case where schoolId might be passed as second arg but meant as logId
  let actualSchoolId: number | undefined;
  let actualLogId = logId;

  if (typeof schoolId === 'number') {
    actualSchoolId = schoolId;
  } else if (typeof schoolId === 'string') {
    actualLogId = schoolId;
  }

  logger.debug(`permissionService.getEffectivePermissions: Entry userId=${userId} schoolId=${actualSchoolId} logId=${actualLogId}`);
  try {
    // 1. Get User Overrides (Global)
    const overrides = await UserPermission.findAll({
      where: { user_id: userId },
      include: [{
        model: Permission,
        required: true
      }]
    });

    // 2. Resolve Role for Context
    let roleSlug: string | undefined;
    if (actualSchoolId) {
      const membership = await SchoolMember.findOne({
        where: { user_id: userId, school_id: actualSchoolId }
      });
      if (membership) {
        roleSlug = membership.role;
      }
    }

    if (!roleSlug) {
      const user = await User.findByPk(userId);
      roleSlug = user?.role;
    }

    const effectivePermissions = new Set<string>();

    // 3. Add Role Permissions
    if (roleSlug) {
      const role = await Role.findOne({
        where: { slug: roleSlug },
        include: [{
          model: Permission,
          as: 'permissions',
        }]
      });

      if ((role as any)?.permissions) {
        (role as any).permissions.forEach((perm: any) => {
          effectivePermissions.add(perm.slug);
        });
      }
    }

    // 4. Apply Overrides
    if (overrides.length > 0) {
      overrides.forEach((override: any) => {
        const permSlug = override.Permission.slug;
        if (override.access_type === PermissionAccess.DENY) {
          effectivePermissions.delete(permSlug);
        } else if (override.access_type === PermissionAccess.ALLOW) {
          effectivePermissions.add(permSlug);
        }
      });
    }

    return Array.from(effectivePermissions);
  } catch (error: any) {
    logger.error(`permissionService.getEffectivePermissions error: userId=${userId} schoolId=${actualSchoolId} error=${error.message}`);
    return [];
  }
};
