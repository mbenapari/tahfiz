import { User, Role, Permission, UserPermission, RolePermission } from '../model';
import { PermissionAccess } from '../model/UserPermission';

/**
 * Checks if a user has a specific permission.
 * Resolution logic:
 * 1. Check User Overrides (UserPermission table)
 *    - If DENY, return false.
 *    - If ALLOW, return true.
 * 2. If no override, check Role Defaults (RolePermission table via Role)
 *    - If permission exists for role, return true.
 * 3. Default to false.
 */
export const hasPermission = async (userId: number, permissionSlug: string): Promise<boolean> => {
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
      return override.access_type === PermissionAccess.ALLOW;
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

    // If user has a role and that role has the permission
    if (user?.role_obj) {
      return true;
    }

    return false;
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
    if (user?.role_obj?.permissions) {
      user.role_obj.permissions.forEach((perm: any) => {
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
