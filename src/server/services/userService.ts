import { FindOptions, Op } from 'sequelize';
import { User, Role, SchoolMember, School, Session, MemorizationRecord, Surah, Attendance, RevisionRecord, JuzMap } from '../model';
import { UserRole } from '../model/User';
import * as progressService from './progressService';
import * as statsService from './statsService';
import * as queryHelper from '../helper/queryHelper';
import { generateBlindIndex } from '../utils/crypto';
import logger from '../utils/logger';
import { DEFAULT_PAGE_SIZE, TOTAL_QURAN_AYAHS, VELOCITY_BUCKET_SIZE, RECENT_ACTIVITY_LIMIT } from '../constants';

export interface CreateUserDTO {
  tenant_id?: number;
  role_id?: number;
  first_name: string;
  last_name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role: UserRole;
  student_identifier?: string;
  is_onboarded?: boolean;
}

export interface UpdateUserDTO {
  tenant_id?: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  phone?: string;
  role?: UserRole;
  role_id?: number;
  student_identifier?: string;
  is_onboarded?: boolean;
}

export const createUser = async (data: CreateUserDTO, transaction?: any) => {
  const startTime = Date.now();
  logger.debug('userService.createUser: Entry', { 
    email: data.email, 
    role: data.role,
    tenant_id: data.tenant_id 
  });
  
  try {
    // If role_id is not provided, try to find it by the role enum slug
    if (!data.role_id) {
      const role = await Role.findOne({ where: { slug: data.role }, transaction });
      if (role) {
        data.role_id = role.id;
        logger.debug(`userService.createUser: Found role_id ${role.id} for slug ${data.role}`);
      } else {
        const errorMsg = `System Error: Role '${data.role}' not found.`;
        logger.error(`userService.createUser: ${errorMsg}`, { role: data.role });
        throw new Error(`${errorMsg} Please contact administrator.`);
      }
    }

    // Check for existing user with same email (blind index)
    if (data.email) {
      const emailBlindIndex = generateBlindIndex(data.email);
      const existingUser = await User.findOne({ where: { email_blind_index: emailBlindIndex }, transaction });
      if (existingUser) {
        throw new Error('Email already registered');
      }
    }

    const user = await User.create(data, { transaction });
    
    logger.info('userService.createUser: Success', { 
      userId: user.id, 
      email: user.email,
      latency: Date.now() - startTime 
    });
    
    return user;
  } catch (error: any) {
    logger.error('userService.createUser: Error', { 
      error: error.message, 
      email: data.email,
      stack: error.stack 
    });
    throw error;
  }
};

export const getUserById = async (id: number) => {
  logger.debug(`userService.getUserById: Entry`, { userId: id });
  try {
    const user = await User.findByPk(id, {
      include: [{
        model: School,
        as: 'tenant',
        attributes: ['name', 'slug']
      }]
    });
    if (!user) {
      logger.warn(`userService.getUserById: User not found`, { userId: id });
      throw new Error('User not found');
    }
    logger.debug(`userService.getUserById: Success`, { userId: id });
    return user;
  } catch (error: any) {
    logger.error(`userService.getUserById: Error`, { userId: id, error: error.message });
    throw error;
  }
};

export const getUserInTenant = async (id: number, tenant_id: number) => {
  logger.debug(`userService.getUserInTenant: Entry`, { userId: id, tenant_id });
  try {
    // 1. Check direct tenant_id on User table
    const user = await User.findOne({
      where: { 
        id,
        tenant_id
      }
    });

    if (user) {
      logger.debug(`userService.getUserInTenant: Found via tenant_id`, { userId: id, tenant_id });
      return user;
    }

    // 2. Check as member via SchoolMember
    const member = await User.findOne({
      where: { id },
      include: [{
        model: School,
        as: 'schools',
        where: { id: tenant_id },
        required: true
      }]
    });
    
    if (member) {
      logger.debug(`userService.getUserInTenant: Found via SchoolMember`, { userId: id, tenant_id });
      return member;
    }

    // 3. Check if owner
    const owner = await User.findOne({
      where: { id },
      include: [{
        model: School,
        as: 'ownedSchools',
        where: { id: tenant_id },
        required: true
      }]
    });
    if (owner) {
      logger.debug(`userService.getUserInTenant: Found as owner`, { userId: id, tenant_id });
      return owner;
    }
    
    logger.warn(`userService.getUserInTenant: User not found in institution`, { userId: id, tenant_id });
    throw new Error('User not found in this institution');
  } catch (error: any) {
    if (error.message === 'User not found in this institution') {
      throw error;
    }
    logger.error(`userService.getUserInTenant: Error`, { userId: id, tenant_id, error: error.message });
    throw error;
  }
};

export const getUserByEmail = async (email: string, tenant_id?: number) => {
  logger.debug(`userService.getUserByEmail: Entry`, { email, tenant_id });
  try {
    const emailBlindIndex = generateBlindIndex(email);
    const where: any = { email_blind_index: emailBlindIndex };
    if (tenant_id) {
      where.tenant_id = tenant_id;
    }
    const user = await User.findOne({
      where,
      include: [{
        model: School,
        as: 'tenant',
        attributes: ['name', 'slug']
      }]
    });
    
    if (user) {
      logger.debug(`userService.getUserByEmail: Found user`, { userId: user.id, email });
    } else {
      logger.debug(`userService.getUserByEmail: User not found`, { email });
    }
    
    return user;
  } catch (error: any) {
    logger.error(`userService.getUserByEmail: Error`, { email, error: error.message });
    throw error;
  }
};

export const getAllUsers = async (tenant_id: number, options?: FindOptions) => {
  try {
    // Get members + owners
    const users = await User.findAll({
      include: [{
        model: SchoolMember,
        as: 'schoolMembers', // Note: Need to check alias in index.ts
        where: { school_id: tenant_id },
        required: true
      }],
      ...options,
    });
    return users;
  } catch (error) {
    throw error;
  }
};

export const getUsersByRole = async (tenantId: number, role: UserRole) => {
  try {
    const users = await User.findAll({
      where: { role, tenant_id: tenantId },
      include: [{
        model: School,
        as: 'tenant',
        attributes: ['name', 'slug']
      }]
    });
    return users;
  } catch (error) {
    throw error;
  }
};

export const getInstructorsByTenant = async (tenantId: number) => {
  logger.debug(`userService.getInstructorsByTenant: Entry`, { tenantId });
  try {
    const instructors = await User.findAll({
      where: {
        tenant_id: tenantId,
        role: UserRole.INSTRUCTOR
      },
      attributes: ['id', 'first_name', 'last_name', 'email', 'phone', 'role'],
      order: [['first_name', 'ASC']]
    });
    logger.debug(`userService.getInstructorsByTenant: Success`, { tenantId, count: instructors.length });
    return instructors;
  } catch (error: any) {
    logger.error(`userService.getInstructorsByTenant: Error`, { tenantId, error: error.message });
    throw error;
  }
};

const mapStudentWithProgress = async (user: any, tenantId: number, preCalculatedProgress?: progressService.ProgressResult) => {
  const userJSON = user.toJSON() as any;
  
  // Calculate last session
  let lastSession = { time: 'No sessions yet', detail: '-' };
  if (userJSON.student_sessions && userJSON.student_sessions.length > 0) {
    lastSession = {
      time: userJSON.student_sessions[0].session_date,
      detail: userJSON.student_sessions[0].notes || 'Completed session'
    };
  }

  // Calculate progress and current level
  const calculatedProgress = preCalculatedProgress || await progressService.calculateStudentProgress(user.id, tenantId);

  return {
    ...userJSON,
    lastSession,
    currentLevel: calculatedProgress.currentLevel,
    progress: {
      percentage: calculatedProgress.percentage,
      status: calculatedProgress.status,
      statusColor: calculatedProgress.statusColor,
      barColor: calculatedProgress.barColor
    }
  };
};

export const getStudentsWithProgress = async (tenantId: number, page: number = 1, limit: number = DEFAULT_PAGE_SIZE) => {
  try {
    const offset = (page - 1) * limit;
    
    const { count, rows: users } = await User.findAndCountAll({
      where: { role: UserRole.STUDENT, tenant_id: tenantId },
      limit,
      offset,
      include: [
        {
          model: School,
          as: 'tenant',
          attributes: ['name', 'slug']
        },
        {
          model: Session,
          as: 'student_sessions',
          limit: 1,
          order: [['session_date', 'DESC']],
          attributes: ['session_date', 'notes']
        }
      ]
    });

    // Batch calculate progress for all students in this page
    const studentIds = users.map(u => u.id);
    const batchProgress = await progressService.calculateBatchStudentProgress(studentIds, tenantId);

    const studentData = await Promise.all(users.map(user => 
      mapStudentWithProgress(user, tenantId, batchProgress[user.id])
    ));

    return {
      students: studentData,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };

  } catch (error) {
    logger.error('userService.getStudentsWithProgress: Error', { error: (error as Error).message });
    throw error;
  }
};

export const searchStudentsWithProgress = async (query: string, tenantId: number, page: number = 1, limit: number = DEFAULT_PAGE_SIZE) => {
  try {
    const offset = (page - 1) * limit;

    const fields = ['first_name', 'last_name', 'email', 'student_identifier'];
    const where: any = {
      role: UserRole.STUDENT,
      tenant_id: tenantId,
      ...queryHelper.buildSearchWhereClause(query, fields)
    };

    const { count, rows: users } = await User.findAndCountAll({
      where,
      limit,
      offset,
      include: [
        {
          model: School,
          as: 'tenant',
          attributes: ['name', 'slug']
        },
        {
          model: Session,
          as: 'student_sessions',
          limit: 1,
          order: [['session_date', 'DESC']],
          attributes: ['session_date', 'notes']
        }
      ]
    });

    // Batch calculate progress for all students in this page
    const studentIds = users.map(u => u.id);
    const batchProgress = await progressService.calculateBatchStudentProgress(studentIds, tenantId);

    const studentData = await Promise.all(users.map(user => 
      mapStudentWithProgress(user, tenantId, batchProgress[user.id])
    ));

    return {
      students: studentData,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error) {
    logger.error('userService.searchStudentsWithProgress: Error', { error: (error as Error).message });
    throw error;
  }
};

export const searchUsers = async (query: string, tenantId?: number) => {
  try {
    const fields = ['first_name', 'last_name', 'email', 'phone'];
    const where: any = {
      ...queryHelper.buildSearchWhereClause(query, fields)
    };

    if (tenantId) {
      where.tenant_id = tenantId;
    }

    const users = await User.findAll({
      where,
      limit: 10
    });
    return users;
  } catch (error) {
    throw error;
  }
};

export const getStudentProfile = async (id: number, tenantId: number) => {
  try {
    const user = await User.findOne({
      where: { id, tenant_id: tenantId, role: UserRole.STUDENT },
      include: [
        {
          model: School,
          as: 'tenant',
          attributes: ['name', 'slug']
        },
        {
          model: Session,
          as: 'student_sessions',
          include: [
            { model: User, as: 'instructor', attributes: ['first_name', 'last_name'] },
            { model: Attendance, as: 'attendance', attributes: ['status'] },
            { 
              model: MemorizationRecord, 
              as: 'memorization_records',
              include: [{ model: Surah, as: 'surah', attributes: ['name', 'number'] }]
            },
            { 
              model: RevisionRecord, 
              as: 'revision_records',
              include: [{ model: Surah, as: 'surah', attributes: ['name', 'number'] }]
            }
          ],
          order: [['session_date', 'DESC']],
          limit: 10
        }
      ]
    });

    if (!user) {
      throw new Error('Student not found in this school');
    }

    const userJSON = user.toJSON() as any;
    
    // 2. Calculate Progress Metrics and Mastery Data concurrently
    const [studentStats, allSurahs, memorizationRecordsAll, revisionRecordsAll] = await Promise.all([
      statsService.getStudentIndividualStats(id, tenantId),
      Surah.findAll({ order: [['number', 'ASC']] }),
      MemorizationRecord.findAll({
        where: { student_id: id, tenant_id: tenantId },
        attributes: ['surah_number', 'start_ayah', 'end_ayah', 'created_at']
      }),
      RevisionRecord.findAll({
        where: { student_id: id, tenant_id: tenantId },
        attributes: ['surah_number', 'start_ayah', 'end_ayah']
      })
    ]);

    const totalAyahsMemorized = studentStats.totalAyahsMemorized;
    const completionPercentage = studentStats.completionPercentage;
    const attendanceRate = studentStats.attendanceRate;

    // 3. Activity Log
    const activityLog = userJSON.student_sessions.map((session: any) => {
      const activities: any[] = [];
      
      if (session.attendance) {
        activities.push({
          id: `att-${session.id}`,
          type: 'attendance',
          title: `Attendance: ${session.attendance.status.charAt(0).toUpperCase() + session.attendance.status.slice(1)}`,
          time: session.session_date,
          meta: '',
          icon: 'Calendar',
          color: session.attendance.status === 'present' ? 'text-text-muted' : 'text-red-400'
        });
      }

      session.memorization_records?.forEach((m: any) => {
        activities.push({
          id: `mem-${m.id}`,
          type: 'completed',
          title: `Memorized ${m.surah?.name || 'Surah'}`,
          time: session.session_date,
          meta: `Ayahs ${m.start_ayah}-${m.end_ayah}`,
          icon: 'CheckCircle2',
          color: 'text-primary'
        });
      });

      session.revision_records?.forEach((r: any) => {
        activities.push({
          id: `rev-${r.id}`,
          type: 'revised',
          title: `Revised ${r.surah?.name || 'Surah'}`,
          time: session.session_date,
          meta: r.notes || '',
          icon: 'Clock',
          color: 'text-blue-400'
        });
      });

      return activities;
    }).flat().slice(0, RECENT_ACTIVITY_LIMIT);

    const mBySurah = new Map<number, typeof memorizationRecordsAll>();
    for (const r of memorizationRecordsAll) {
      const arr = mBySurah.get(r.surah_number) ?? [];
      arr.push(r);
      mBySurah.set(r.surah_number, arr);
    }

    const rBySurah = new Map<number, typeof revisionRecordsAll>();
    for (const r of revisionRecordsAll) {
      const arr = rBySurah.get(r.surah_number) ?? [];
      arr.push(r);
      rBySurah.set(r.surah_number, arr);
    }

    const masteryData = allSurahs.map(surah => {
      const sNum = surah.number;
      const mRecords = mBySurah.get(sNum) ?? [];
      const rRecords = rBySurah.get(sNum) ?? [];

      let status = 0; // Not Started
      let details = 'Not started yet';

      if (mRecords.length > 0) {
        status = 1; // Memorized (at least partially)
        // Find the range covered
        const start = Math.min(...mRecords.map(r => r.start_ayah));
        const end = Math.max(...mRecords.map(r => r.end_ayah));
        
        if (start === 1 && end === surah.ayah_count) {
          details = `Fully Memorized (1-${surah.ayah_count})`;
        } else {
          details = `Memorized Ayahs: ${start}-${end}`;
        }
      }

      // If there are revision records, it might "Need Revision" (status 2)
      // For simplicity, if there's a recent revision record, we can mark it
      if (rRecords.length > 0) {
        status = 2; // Needs Revision / In Revision
        const start = Math.min(...rRecords.map(r => r.start_ayah));
        const end = Math.max(...rRecords.map(r => r.end_ayah));
        details = `In Revision: Ayahs ${start}-${end}`;
      }

      return {
        number: sNum,
        name: surah.name,
        ayahCount: surah.ayah_count,
        status,
        details
      };
    });

    // 5. Velocity Data (Last 8 Weeks) - Single pass optimization
    const now = new Date();
    const velocityBuckets = Array(8).fill(0);
    const weekRanges = Array.from({ length: 8 }, (_, i) => {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7 + now.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      return { start: weekStart, end: weekEnd };
    });

    memorizationRecordsAll.forEach(r => {
      const recordDate = new Date((r as any).created_at);
      for (let i = 0; i < 8; i++) {
        if (recordDate >= weekRanges[i].start && recordDate <= weekRanges[i].end) {
          velocityBuckets[i] += (r.end_ayah - r.start_ayah + 1);
          break;
        }
      }
    });

    const velocityData = velocityBuckets.map((totalAyahs, i) => {
      const pages = Math.round((totalAyahs / VELOCITY_BUCKET_SIZE) * 10) / 10;
      return {
        week: `W${8-i}`,
        pages: pages || 0
      };
    }).reverse();

    return {
       ...userJSON,
       stats: {
         juzs: { current: Math.floor(totalAyahsMemorized / 200), total: 30 }, // Approximation
         completion: completionPercentage,
         attendance: { value: attendanceRate, trend: 'stable' }
       },
       activityLog,
       masteryData,
       velocityData
     };
   } catch (error) {
     logger.error('userService.getStudentProfile: Error', { id, error: (error as Error).message });
     throw error;
   }
 };
 
 export const updateUser = async (id: number, data: UpdateUserDTO) => {
   try {
     const user = await getUserById(id);
     await user.update(data);
     return user;
   } catch (error) {
     throw error;
   }
 };

// Platform-level helpers for owner management
export const getAllPlatformUsers = async () => {
  try {
    const users = await User.findAll({ include: [{ model: School, as: 'tenant', attributes: ['name', 'slug'] }] });
    return users;
  } catch (error) {
    throw error;
  }
};

export const deleteUserById = async (id: number) => {
  try {
    const user = await User.findByPk(id);
    if (!user) throw new Error('User not found');
    await user.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};
