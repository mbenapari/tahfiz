import { School, User, SchoolMember } from '../model';
import { ScheduleService } from './scheduleService';
import { UserRole } from '../model/User';
import logger from '../utils/logger';

// DTOs
export interface CreateSchoolDTO {
  name: string;
  slug: string;
  owner_id: number;
  timezone?: string;
  study_days: number[];
  start_time?: string;
  end_time?: string;
  email?: string;
  phone?: string;
  address?: string;
  schedule_mode?: 'simple' | 'advanced';
  session_type_day_map?: Record<string, number[]> | null;
  enabled_memorization_subtypes?: Array<{ key: string; label: string; active: boolean }> | null;
}

export interface UpdateSchoolDTO {
  name?: string;
  slug?: string;
  timezone?: string;
  study_days?: number[];
  start_time?: string;
  end_time?: string;
  email?: string;
  phone?: string;
  address?: string;
  schedule_mode?: 'simple' | 'advanced';
  session_type_day_map?: Record<string, number[]> | null;
  enabled_memorization_subtypes?: Array<{ key: string; label: string; active: boolean }> | null;
}

// Branch-specific DTOs
export interface CreateBranchDTO {
  name: string;
  slug: string;
  branchCode: string;
  owner_id: number;
  timezone?: string;
  study_days?: number[];
  schedule_mode?: 'simple' | 'advanced';
  session_type_day_map?: Record<string, number[]> | null;
  enabled_memorization_subtypes?: Array<{ key: string; label: string; active: boolean }> | null;
  address?: string;
  email?: string;
  phone?: string;
}

export interface UpdateBranchDTO {
  name?: string;
  timezone?: string;
  study_days?: number[];
  schedule_mode?: 'simple' | 'advanced';
  session_type_day_map?: Record<string, number[]> | null;
  enabled_memorization_subtypes?: Array<{ key: string; label: string; active: boolean }> | null;
  address?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
}

export interface BranchAdminGrantDTO {
  userId: number;
  branchId: number;
  isPrimaryAdmin?: boolean;
}

export const createSchool = async (data: CreateSchoolDTO) => {
  try {
    const validation = ScheduleService.validateScheduleConfiguration({
      schedule_mode: data.schedule_mode,
      study_days: data.study_days,
      session_type_day_map: data.session_type_day_map,
    });

    if (!validation.isValid) {
      const error = new Error(validation.error || 'Invalid schedule configuration');
      (error as any).code = validation.code;
      (error as any).details = validation.details;
      throw error;
    }

    const school = await School.create({
      ...data,
      timezone: data.timezone || 'UTC',
    });
    return school;
  } catch (error) {
    throw error;
  }
};

export const getSchoolById = async (id: number) => {
  try {
    const school = await School.findByPk(id);
    if (!school) {
      throw new Error('School not found');
    }
    return school;
  } catch (error) {
    throw error;
  }
};

export const getSchoolsByName = async (name: string) => {
  try {
    const schools = await School.findAll({
      where: { name },
    });
    return schools;
  } catch (error) {
    throw error;
  }
};

export const getAllSchools = async () => {
  try {
    const schools = await School.findAll();
    return schools;
  } catch (error) {
    throw error;
  }
};

export const updateSchool = async (id: number, data: UpdateSchoolDTO) => {
  try {
    const school = await getSchoolById(id);
    const mergedSchedule = {
      schedule_mode: data.schedule_mode ?? school.schedule_mode,
      study_days: data.study_days ?? school.study_days,
      session_type_day_map:
        data.session_type_day_map === undefined ? school.session_type_day_map : data.session_type_day_map,
    };

    const validation = ScheduleService.validateScheduleConfiguration(mergedSchedule);
    if (!validation.isValid) {
      const error = new Error(validation.error || 'Invalid schedule configuration');
      (error as any).code = validation.code;
      (error as any).details = validation.details;
      throw error;
    }

    await school.update(data);
    return school;
  } catch (error) {
    throw error;
  }
};

export const deleteSchool = async (id: number) => {
  try {
    const school = await getSchoolById(id);
    await school.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};

// ============================================================================
// BRANCH MANAGEMENT METHODS
// ============================================================================

/**
 * Creates a new branch school under a parent school
 */
export const createBranchSchool = async (
  parentSchoolId: number,
  data: CreateBranchDTO,
  correlationId: string
): Promise<School> => {
  try {
    // Validate parent school exists and is not a branch
    const parentSchool = await getSchoolById(parentSchoolId);
    if (parentSchool.is_branch) {
      const error = new Error('Cannot create branch under a branch school');
      (error as any).code = 'BRANCH_001';
      throw error;
    }

    // Check for duplicate branch code
    const existingBranch = await School.findOne({ where: { branch_code: data.branchCode } });
    if (existingBranch) {
      const error = new Error('Branch code already exists');
      (error as any).code = 'BRANCH_003';
      throw error;
    }

    // If study_days not provided, inherit from parent
    const studyDays = data.study_days ?? parentSchool.study_days;
    const scheduleMode = data.schedule_mode ?? parentSchool.schedule_mode;
    const sessionTypeDayMap = data.session_type_day_map ?? parentSchool.session_type_day_map;

    const branch = await School.create({
      name: data.name,
      slug: data.slug,
      owner_id: data.owner_id,
      branch_code: data.branchCode,
      parent_school_id: parentSchoolId,
      is_branch: true,
      is_active: true,
      timezone: data.timezone || parentSchool.timezone,
      study_days: studyDays,
      schedule_mode: scheduleMode,
      session_type_day_map: sessionTypeDayMap,
      enabled_memorization_subtypes: data.enabled_memorization_subtypes || parentSchool.enabled_memorization_subtypes,
      address: data.address,
      email: data.email,
      phone: data.phone,
      override_study_days: data.study_days ? studyDays : null,
      override_schedule_mode: data.schedule_mode ? scheduleMode : null,
      override_memorization_subtypes: data.enabled_memorization_subtypes ? data.enabled_memorization_subtypes : null,
    });

    logger.info(
      `Branch created: parentId=${parentSchoolId} branchId=${branch.id} name=${data.name} byAdminId=${data.branchCode}`,
      { correlationId, action: 'BRANCH_CREATED' }
    );

    return branch;
  } catch (error) {
    logger.error(`Failed to create branch school: parentId=${parentSchoolId} error=${(error as Error).message}`, {
      correlationId,
      stack: (error as Error).stack,
    });
    throw error;
  }
};

/**
 * Gets all branches for a parent school
 */
export const getBranchesForParentSchool = async (parentSchoolId: number): Promise<School[]> => {
  try {
    const branches = await School.findAll({
      where: {
        parent_school_id: parentSchoolId,
        is_branch: true,
      },
      order: [['name', 'ASC']],
    });
    return branches;
  } catch (error) {
    throw error;
  }
};

/**
 * Gets a branch by ID
 */
export const getBranchById = async (branchId: number): Promise<School> => {
  try {
    const branch = await School.findByPk(branchId);
    if (!branch || !branch.is_branch) {
      const error = new Error('Branch not found');
      (error as any).code = 'BRANCH_002';
      throw error;
    }
    return branch;
  } catch (error) {
    throw error;
  }
};

/**
 * Updates branch settings
 */
export const updateBranchSettings = async (
  branchId: number,
  data: UpdateBranchDTO,
  correlationId: string
): Promise<School> => {
  try {
    const branch = await getBranchById(branchId);

    // Validate schedule if provided
    if (data.study_days || data.schedule_mode || data.session_type_day_map) {
      const mergedSchedule = {
        schedule_mode: data.schedule_mode ?? branch.override_schedule_mode ?? branch.schedule_mode,
        study_days: data.study_days ?? branch.override_study_days ?? branch.study_days,
        session_type_day_map: data.session_type_day_map ?? branch.session_type_day_map,
      };

      const validation = ScheduleService.validateScheduleConfiguration(mergedSchedule);
      if (!validation.isValid) {
        const error = new Error(validation.error || 'Invalid schedule configuration');
        (error as any).code = validation.code;
        throw error;
      }
    }

    // Update override fields if new values provided
    const updateData: any = { ...data };
    if (data.study_days !== undefined) {
      updateData.override_study_days = data.study_days;
    }
    if (data.schedule_mode !== undefined) {
      updateData.override_schedule_mode = data.schedule_mode;
    }
    if (data.enabled_memorization_subtypes !== undefined) {
      updateData.override_memorization_subtypes = data.enabled_memorization_subtypes;
    }

    await branch.update(updateData);

    logger.info(`Branch updated: branchId=${branchId} changes=${JSON.stringify(data)}`, {
      correlationId,
      action: 'BRANCH_UPDATED',
    });

    return branch;
  } catch (error) {
    logger.error(`Failed to update branch: branchId=${branchId} error=${(error as Error).message}`, {
      correlationId,
      stack: (error as Error).stack,
    });
    throw error;
  }
};

/**
 * Deactivates a branch
 */
export const deactivateBranch = async (
  branchId: number,
  reason: string,
  correlationId: string
): Promise<boolean> => {
  try {
    const branch = await getBranchById(branchId);

    // Check for active members
    const memberCount = await SchoolMember.count({ where: { school_id: branchId } });
    if (memberCount > 0) {
      const error = new Error('Cannot deactivate branch with active members');
      (error as any).code = 'BRANCH_005';
      throw error;
    }

    await branch.update({
      is_active: false,
      deactivated_at: new Date(),
    });

    logger.info(`Branch deactivated: branchId=${branchId} reason=${reason}`, {
      correlationId,
      action: 'BRANCH_DEACTIVATED',
    });

    return true;
  } catch (error) {
    logger.error(`Failed to deactivate branch: branchId=${branchId} error=${(error as Error).message}`, {
      correlationId,
      stack: (error as Error).stack,
    });
    throw error;
  }
};

/**
 * Reactivates a branch
 */
export const reactivateBranch = async (
  branchId: number,
  correlationId: string
): Promise<School> => {
  try {
    const branch = await getBranchById(branchId);

    await branch.update({
      is_active: true,
      deactivated_at: null,
    });

    logger.info(`Branch reactivated: branchId=${branchId}`, {
      correlationId,
      action: 'BRANCH_REACTIVATED',
    });

    return branch;
  } catch (error) {
    logger.error(`Failed to reactivate branch: branchId=${branchId} error=${(error as Error).message}`, {
      correlationId,
      stack: (error as Error).stack,
    });
    throw error;
  }
};

// ============================================================================
// CONTEXT MANAGEMENT METHODS
// ============================================================================

/**
 * Switches user's active school context
 */
export const switchSchoolContext = async (
  userId: number,
  targetSchoolId: number,
  correlationId: string
): Promise<User> => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      throw error;
    }

    const fromSchoolId = user.active_school_context || user.tenant_id;

    // Validate access
    const hasAccess = await validateSchoolAccess(userId, targetSchoolId);
    if (!hasAccess) {
      const error = new Error('School access denied');
      (error as any).code = 'CONTEXT_002';
      throw error;
    }

    // Check if school exists and is active (if it's a branch)
    const targetSchool = await School.findByPk(targetSchoolId);
    if (!targetSchool) {
      const error = new Error('School not found');
      (error as any).code = 'BRANCH_001';
      throw error;
    }
    if (targetSchool.is_branch && !targetSchool.is_active) {
      const error = new Error('Branch is deactivated');
      (error as any).code = 'CONTEXT_003';
      throw error;
    }

    await user.update({ active_school_context: targetSchoolId });

    logger.info(`Context switched: userId=${userId} fromSchoolId=${fromSchoolId} toSchoolId=${targetSchoolId}`, {
      correlationId,
      action: 'CONTEXT_SWITCHED',
    });

    return user;
  } catch (error) {
    logger.error(`Failed to switch context: userId=${userId} targetSchoolId=${targetSchoolId} error=${(error as Error).message}`, {
      correlationId,
      stack: (error as Error).stack,
    });
    throw error;
  }
};

/**
 * Gets user's current school context
 */
export const getUserSchoolContext = async (userId: number): Promise<{ user: User; school: School }> => {
  try {
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error('User not found');
      throw error;
    }

    const schoolId = user.active_school_context || user.tenant_id;
    const school = await getSchoolById(schoolId);

    return { user, school };
  } catch (error) {
    throw error;
  }
};

/**
 * Validates if user has access to a specific school
 */
export const validateSchoolAccess = async (userId: number, schoolId: number): Promise<boolean> => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return false;

    // Owner has access to all their schools
    if (user.role === UserRole.ADMIN) {
      const school = await School.findByPk(schoolId);
      if (!school) return false;
      if (school.owner_id === userId) return true;
      if (school.parent_school_id) {
        const parentSchool = await School.findByPk(school.parent_school_id);
        if (parentSchool && parentSchool.owner_id === userId) return true;
      }
    }

    // Check via SchoolMember
    const membership = await SchoolMember.findOne({
      where: { user_id: userId, school_id: schoolId },
    });
    if (membership) return true;

    // Check accessible_school_ids cache
    if (user.accessible_school_ids && user.accessible_school_ids.includes(schoolId)) {
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`validateSchoolAccess error: userId=${userId} schoolId=${schoolId} error=${(error as Error).message}`);
    return false;
  }
};

/**
 * Gets all schools accessible by a user in a structured DTO format
 */
export const getAccessibleSchools = async (userId: number): Promise<any[]> => {
  try {
    const user = await User.findByPk(userId);
    if (!user) return [];

    // 1. Get schools from SchoolMember memberships
    const memberships = await SchoolMember.findAll({
      where: { user_id: userId },
      include: [{ model: School, as: 'school' }],
    });

    const schoolsMap = new Map<number, any>();

    memberships.forEach(m => {
      const school = m.get('school') as School;
      if (school) {
        schoolsMap.set(school.id, {
          id: school.id,
          name: school.name,
          slug: school.slug,
          is_branch: school.is_branch,
          parent_school_id: school.parent_school_id,
          branch_code: school.branch_code,
          is_active: school.is_active,
          role: m.role,
          is_primary: school.id === user.tenant_id,
        });
      }
    });

    // 2. If admin/owner, also include owned schools
    if (user.role === UserRole.ADMIN && user.tenant_id) {
      const ownedSchool = await School.findByPk(user.tenant_id);
      if (ownedSchool && !schoolsMap.has(ownedSchool.id)) {
        schoolsMap.set(ownedSchool.id, {
          id: ownedSchool.id,
          name: ownedSchool.name,
          slug: ownedSchool.slug,
          is_branch: ownedSchool.is_branch,
          parent_school_id: ownedSchool.parent_school_id,
          branch_code: ownedSchool.branch_code,
          is_active: ownedSchool.is_active,
          role: UserRole.ADMIN,
          is_primary: true,
        });
      }

      // 3. Also get all branches if parent school
      const branches = await getBranchesForParentSchool(user.tenant_id);
      branches.forEach(branch => {
        if (!schoolsMap.has(branch.id)) {
          schoolsMap.set(branch.id, {
            id: branch.id,
            name: branch.name,
            slug: branch.slug,
            is_branch: branch.is_branch,
            parent_school_id: branch.parent_school_id,
            branch_code: branch.branch_code,
            is_active: branch.is_active,
            role: UserRole.ADMIN,
            is_primary: false,
          });
        }
      });
    }

    return Array.from(schoolsMap.values());
  } catch (error) {
    logger.error(`getAccessibleSchools error: userId=${userId} error=${(error as Error).message}`);
    throw error;
  }
};

// ============================================================================
// ACCESS CONTROL METHODS
// ============================================================================

/**
 * Grants branch admin access to a user
 */
export const grantBranchAdminAccess = async (
  parentSchoolId: number,
  userId: number,
  branchId: number,
  grantedByUserId: number,
  isPrimaryAdmin: boolean = false,
  correlationId: string
): Promise<SchoolMember> => {
  try {
    // Validate parent school exists
    const parentSchool = await getSchoolById(parentSchoolId);
    if (!parentSchool.is_branch === false && parentSchool.id !== parentSchoolId) {
      const error = new Error('Invalid parent school');
      (error as any).code = 'BRANCH_001';
      throw error;
    }

    // Validate branch belongs to parent
    const branch = await getBranchById(branchId);
    if (branch.parent_school_id !== parentSchoolId) {
      const error = new Error('Branch does not belong to this parent school');
      (error as any).code = 'BRANCH_002';
      throw error;
    }

    // Check if membership already exists
    const existing = await SchoolMember.findOne({
      where: { user_id: userId, school_id: branchId },
    });
    if (existing) {
      const error = new Error('User is already a member of this branch');
      (error as any).code = 'ADMIN_002';
      throw error;
    }

    // Create or update membership
    const membership = await SchoolMember.create({
      user_id: userId,
      school_id: branchId,
      role: UserRole.ADMIN,
      scope_type: 'branch',
      is_primary_admin: isPrimaryAdmin,
      granted_by_user_id: grantedByUserId,
      granted_at: new Date(),
    });

    logger.info(`Branch admin access granted: userId=${userId} branchId=${branchId} grantedBy=${grantedByUserId}`, {
      correlationId,
      action: 'BRANCH_ADMIN_GRANTED',
    });

    return membership;
  } catch (error) {
    logger.error(`Failed to grant branch admin access: userId=${userId} branchId=${branchId} error=${(error as Error).message}`, {
      correlationId,
      stack: (error as Error).stack,
    });
    throw error;
  }
};

/**
 * Revokes branch admin access from a user
 */
export const revokeBranchAdminAccess = async (
  branchId: number,
  userId: number,
  correlationId: string
): Promise<boolean> => {
  try {
    const membership = await SchoolMember.findOne({
      where: { user_id: userId, school_id: branchId },
    });

    if (!membership) {
      const error = new Error('User is not a branch admin');
      (error as any).code = 'ADMIN_001';
      throw error;
    }

    await membership.destroy();

    logger.info(`Branch admin access revoked: userId=${userId} branchId=${branchId}`, {
      correlationId,
      action: 'BRANCH_ADMIN_REVOKED',
    });

    return true;
  } catch (error) {
    logger.error(`Failed to revoke branch admin access: userId=${userId} branchId=${branchId} error=${(error as Error).message}`, {
      correlationId,
      stack: (error as Error).stack,
    });
    throw error;
  }
};

/**
 * Gets all admins for a branch
 */
export const getBranchAdmins = async (branchId: number): Promise<User[]> => {
  try {
    const memberships = await SchoolMember.findAll({
      where: { school_id: branchId, role: UserRole.ADMIN },
      include: [{ model: User, as: 'user' }],
    });

    return memberships.map(m => m.get('user') as User).filter(Boolean);
  } catch (error) {
    throw error;
  }
};

// ============================================================================
// ENHANCED EXISTING METHODS
// ============================================================================

/**
 * Gets school members with scope awareness
 */
export const getSchoolMembers = async (schoolId: number): Promise<SchoolMember[]> => {
  try {
    const members = await SchoolMember.findAll({
      where: { school_id: schoolId },
      include: [{ model: User, as: 'user' }],
    });
    return members;
  } catch (error) {
    throw error;
  }
};

/**
 * Adds a member to a school
 */
export const addSchoolMember = async (
  schoolId: number,
  userId: number,
  role: UserRole,
  grantedByUserId?: number
): Promise<SchoolMember> => {
  try {
    const membership = await SchoolMember.create({
      user_id: userId,
      school_id: schoolId,
      role,
      scope_type: 'school',
      is_primary_admin: false,
      granted_by_user_id: grantedByUserId || null,
      granted_at: grantedByUserId ? new Date() : null,
    });
    return membership;
  } catch (error) {
    throw error;
  }
};

/**
 * Removes a member from a school
 */
export const removeSchoolMember = async (schoolId: number, userId: number): Promise<boolean> => {
  try {
    const membership = await SchoolMember.findOne({
      where: { user_id: userId, school_id: schoolId },
    });
    if (!membership) return false;
    await membership.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};
