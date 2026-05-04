import { User, Role, Permission, UserPermission, RolePermission } from '../model';
import { PermissionAccess } from '../model/UserPermission';

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
export const hasPermission = async (userId: number, permissionSlug: string): Promise<boolean> => {
  const cacheKey = `user:${userId}:perm:${permissionSlug}`;
  const cached = cacheGet(cacheKey);
  if (cached !== null) return cached as boolean;

  try {
    // 1. Check User Overrides
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

    // 2. Check Role Defaults
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
    cacheSet(cacheKey, result);
    return result;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
};

/**
 * Gets all effective permissions for a user (merged defaults and overrides).
 * Returns a list of permission slugs.
 */
export const getEffectivePermissions = async (userId: number): Promise<string[]> => {
  try {
    // 1. Get User Overrides
    const overrides = await UserPermission.findAll({
      where: { user_id: userId },
      include: [{
        model: Permission,
        required: true
      }]
    });

    // 2. Get User's Role Permissions
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
      (user as any).role_obj.permissions.forEach((perm: any) => {
        effectivePermissions.add(perm.slug);
      });
    }

    // Apply Overrides
    // If DENY, remove from set. If ALLOW, add to set.
    // Note: Overrides query result structure depends on how Sequelize returns it, assuming 'Permission' is populated
    overrides.forEach((override: any) => {
      const permSlug = override.Permission.slug;
      if (override.access_type === PermissionAccess.DENY) {
        effectivePermissions.delete(permSlug);
      } else if (override.access_type === PermissionAccess.ALLOW) {
        effectivePermissions.add(permSlug);
      }
    });

    return Array.from(effectivePermissions);
  } catch (error) {
    console.error('Error getting effective permissions:', error);
    return [];
  }
};
