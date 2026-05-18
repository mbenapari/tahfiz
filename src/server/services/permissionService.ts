import { User, Role, Permission, UserPermission, RolePermission } from '../model';
import { PermissionAccess } from '../model/UserPermission';
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
 * Checks if a user has a specific permission.
 * Resolution logic:
 * 1. Check User Overrides (UserPermission table)
 *    - If DENY, return false.
 *    - If ALLOW, return true.
 * 2. If no override, check Role Defaults (RolePermission table via Role)
 *    - If permission exists for role, return true.
 * 3. Default to false.
 *
 * Results are cached per user+permission for 5 minutes.
 */
export const hasPermission = async (userId: number, permissionSlug: string, logId: string = 'N/A'): Promise<boolean> => {
  const cacheKey = `user:${userId}:perm:${permissionSlug}`;
  const cached = cacheGet(cacheKey);
  
  if (cached !== null) {
    logger.debug(`permissionService.hasPermission: Cache HIT userId=${userId} permissionSlug=${permissionSlug} result=${cached} logId=${logId}`);
    return cached as boolean;
  }

  logger.debug(`permissionService.hasPermission: Cache MISS userId=${userId} permissionSlug=${permissionSlug} logId=${logId}`);

  try {
    // 1. Check User Overrides
    logger.debug(`permissionService.hasPermission: Checking user overrides userId=${userId} permissionSlug=${permissionSlug} logId=${logId}`);
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
      logger.info(`permissionService.hasPermission: Found user override userId=${userId} permissionSlug=${permissionSlug} accessType=${override.access_type} result=${result} logId=${logId}`);
      cacheSet(cacheKey, result);
      return result;
    }

    // 2. Check Role Defaults
    logger.debug(`permissionService.hasPermission: Checking role defaults userId=${userId} permissionSlug=${permissionSlug} logId=${logId}`);
    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'role_obj',
        include: [{
          model: Permission,
          as: 'permissions',
          where: { slug: permissionSlug },
          required: true
        }]
      }]
    });

    const result = (user as any)?.role_obj ? true : false;
    logger.info(`permissionService.hasPermission: Role default check complete userId=${userId} permissionSlug=${permissionSlug} hasRolePermission=${result} logId=${logId}`);
    
    cacheSet(cacheKey, result);
    return result;
  } catch (error: any) {
    logger.error(`permissionService.hasPermission: Error checking permission userId=${userId} permissionSlug=${permissionSlug} error=${error.message} logId=${logId}`);
    if (error.stack) logger.error(`permissionService.hasPermission: Stack trace userId=${userId} logId=${logId} stack=${error.stack}`);
    return false;
  }
};

/**
 * Gets all effective permissions for a user (merged defaults and overrides).
 * Returns a list of permission slugs.
 */
export const getEffectivePermissions = async (userId: number, logId: string = 'N/A'): Promise<string[]> => {
  logger.debug(`permissionService.getEffectivePermissions: Entry userId=${userId} logId=${logId}`);
  try {
    // 1. Get User Overrides
    logger.debug(`permissionService.getEffectivePermissions: Fetching user overrides userId=${userId} logId=${logId}`);
    const overrides = await UserPermission.findAll({
      where: { user_id: userId },
      include: [{
        model: Permission,
        required: true
      }]
    });

    // 2. Get User's Role Permissions
    logger.debug(`permissionService.getEffectivePermissions: Fetching role permissions userId=${userId} logId=${logId}`);
    const user = await User.findByPk(userId, {
      include: [{
        model: Role,
        as: 'role_obj',
        include: [{
          model: Permission,
          as: 'permissions',
        }]
      }]
    });

    const effectivePermissions = new Set<string>();

    // Add Role Permissions first
    if ((user as any)?.role_obj?.permissions) {
      const rolePermissionsCount = (user as any).role_obj.permissions.length;
      logger.debug(`permissionService.getEffectivePermissions: Adding ${rolePermissionsCount} role permissions userId=${userId} logId=${logId}`);
      (user as any).role_obj.permissions.forEach((perm: any) => {
        effectivePermissions.add(perm.slug);
      });
    }

    // Apply Overrides
    if (overrides.length > 0) {
      logger.debug(`permissionService.getEffectivePermissions: Applying ${overrides.length} overrides userId=${userId} logId=${logId}`);
      overrides.forEach((override: any) => {
        const permSlug = override.Permission.slug;
        if (override.access_type === PermissionAccess.DENY) {
          logger.debug(`permissionService.getEffectivePermissions: Denying permission via override userId=${userId} permissionSlug=${permSlug} logId=${logId}`);
          effectivePermissions.delete(permSlug);
        } else if (override.access_type === PermissionAccess.ALLOW) {
          logger.debug(`permissionService.getEffectivePermissions: Allowing permission via override userId=${userId} permissionSlug=${permSlug} logId=${logId}`);
          effectivePermissions.add(permSlug);
        }
      });
    }

    const finalCount = effectivePermissions.size;
    logger.info(`permissionService.getEffectivePermissions: Success userId=${userId} finalPermissionCount=${finalCount} logId=${logId}`);
    return Array.from(effectivePermissions);
  } catch (error: any) {
    logger.error(`permissionService.getEffectivePermissions: Error getting effective permissions userId=${userId} error=${error.message} logId=${logId}`);
    if (error.stack) logger.error(`permissionService.getEffectivePermissions: Stack trace userId=${userId} logId=${logId} stack=${error.stack}`);
    return [];
  }
};
