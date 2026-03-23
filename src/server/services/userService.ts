import { FindOptions, Op } from 'sequelize';
import { User, Role, SchoolMember, School, Session, MemorizationRecord, Surah, Attendance, RevisionRecord } from '../model';
import { UserRole } from '../model/User';
import logger from '../utils/logger';

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
}

export const createUser = async (data: CreateUserDTO) => {
  const startTime = Date.now();
  logger.debug('userService.createUser: Entry', { 
    email: data.email, 
    role: data.role,
    tenant_id: data.tenant_id 
  });
  
  try {
    // If role_id is not provided, try to find it by the role enum slug
    if (!data.role_id) {
      const role = await Role.findOne({ where: { slug: data.role } });
      if (role) {
        data.role_id = role.id;
        logger.debug(`userService.createUser: Found role_id ${role.id} for slug ${data.role}`);
      } else {
        const errorMsg = `System Error: Role '${data.role}' not found.`;
        logger.error(`userService.createUser: ${errorMsg}`, { role: data.role });
        throw new Error(`${errorMsg} Please contact administrator.`);
      }
    }
    const user = await User.create(data);
    
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
    const user = await User.findOne({
      where: { id },
      include: [{
        model: School,
        as: 'schools',
        where: { id: tenant_id },
        required: true
      }]
    });
    
    if (!user) {
      // Check if owner
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
    }
    logger.debug(`userService.getUserInTenant: Success`, { userId: id, tenant_id });
    return user;
  } catch (error: any) {
    logger.error(`userService.getUserInTenant: Error`, { userId: id, tenant_id, error: error.message });
    throw error;
  }
};

export const getUserByEmail = async (email: string, tenant_id?: number) => {
  logger.debug(`userService.getUserByEmail: Entry`, { email, tenant_id });
  try {
    const where: any = { email };
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

export const getUsersByRole = async (tenant_id: number, role: UserRole) => {
  try {
    const users = await User.findAll({
      where: { role, tenant_id },
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

export const getStudentsWithProgress = async (tenant_id: number) => {
  try {
    const users = await User.findAll({
      where: { role: UserRole.STUDENT, tenant_id },
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
        },
        {
          model: MemorizationRecord,
          as: 'student_memorization_records',
          include: [
            {
              model: Surah,
              as: 'surah',
              attributes: ['name', 'number']
            }
          ],
          order: [['created_at', 'DESC']]
        }
      ]
    });

    const totalQuranAyahs = 6236; // Approx total ayahs in Quran

    return users.map(user => {
      const userJSON = user.toJSON() as any;
      
      // Calculate last session
      let lastSession = { time: 'No sessions yet', detail: '-' };
      if (userJSON.student_sessions && userJSON.student_sessions.length > 0) {
        lastSession = {
          time: userJSON.student_sessions[0].session_date,
          detail: userJSON.student_sessions[0].notes || 'Completed session'
        };
      }

      // Calculate progress and current level based on Memorization Records
      let currentLevel = { juz: 30, surah: 'Amma' };
      let progress = {
        percentage: 0,
        status: 'New',
        statusColor: 'text-text-muted',
        barColor: 'bg-text-muted'
      };

      if (userJSON.student_memorization_records && userJSON.student_memorization_records.length > 0) {
        const records = userJSON.student_memorization_records;
        
        // Calculate total ayahs memorized simply by summing (end_ayah - start_ayah + 1)
        // This is a naive calculation, ideally we should merge overlapping ranges
        let totalAyahs = 0;
        const uniqueAyahs = new Set();
        
        records.forEach((record: any) => {
          for(let i = record.start_ayah; i <= record.end_ayah; i++) {
            uniqueAyahs.add(`${record.surah_number}-${i}`);
          }
        });
        
        totalAyahs = uniqueAyahs.size;
        let percentage = Math.round((totalAyahs / totalQuranAyahs) * 100);
        if (percentage > 100) percentage = 100;

        let status = 'Beginner';
        let statusColor = 'text-primary';
        let barColor = 'bg-primary';

        if (percentage > 20 && percentage <= 50) {
          status = 'Intermediate';
          statusColor = 'text-blue-400';
          barColor = 'bg-blue-400';
        } else if (percentage > 50 && percentage <= 80) {
          status = 'Advanced';
          statusColor = 'text-purple-400';
          barColor = 'bg-purple-400';
        } else if (percentage > 80) {
          status = 'Expert';
          statusColor = 'text-green-400';
          barColor = 'bg-green-400';
        } else if (percentage === 0 && records.length > 0) {
          status = 'Started';
        } else if (percentage === 0) {
           status = 'New';
           statusColor = 'text-text-muted';
           barColor = 'bg-text-muted';
        }

        progress = { percentage, status, statusColor, barColor };

        // Latest record for current level
        const latestRecord = records[0];
        if (latestRecord.surah) {
          currentLevel = {
            juz: 30, // Simplification, in real app we look up Juz Map
            surah: latestRecord.surah.name
          };
        }
      }

      return {
        ...userJSON,
        lastSession,
        currentLevel,
        progress
      };
    });

  } catch (error) {
    logger.error('userService.getStudentsWithProgress: Error', { error: (error as Error).message });
    throw error;
  }
};

export const searchStudentsWithProgress = async (query: string, tenant_id: number) => {
  try {
    const where: any = {
      role: UserRole.STUDENT,
      tenant_id,
      [Op.or]: [
        { first_name: { [Op.like]: `%${query}%` } },
        { last_name: { [Op.like]: `%${query}%` } },
        { email: { [Op.like]: `%${query}%` } },
        { student_identifier: { [Op.like]: `%${query}%` } }
      ]
    };

    const users = await User.findAll({
      where,
      limit: 10,
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
        },
        {
          model: MemorizationRecord,
          as: 'student_memorization_records',
          include: [
            {
              model: Surah,
              as: 'surah',
              attributes: ['name', 'number']
            }
          ],
          order: [['created_at', 'DESC']]
        }
      ]
    });

    const totalQuranAyahs = 6236;

    return users.map(user => {
      const userJSON = user.toJSON() as any;
      
      // Calculate last session
      let lastSession = { time: 'No sessions yet', detail: '-' };
      if (userJSON.student_sessions && userJSON.student_sessions.length > 0) {
        lastSession = {
          time: userJSON.student_sessions[0].session_date,
          detail: userJSON.student_sessions[0].notes || 'Completed session'
        };
      }

      // Calculate progress and current level based on Memorization Records
      let currentLevel = { juz: 30, surah: 'Amma' };
      let progress = {
        percentage: 0,
        status: 'New',
        statusColor: 'text-text-muted',
        barColor: 'bg-text-muted'
      };

      if (userJSON.student_memorization_records && userJSON.student_memorization_records.length > 0) {
        const records = userJSON.student_memorization_records;
        
        let totalAyahs = 0;
        const uniqueAyahs = new Set();
        
        records.forEach((record: any) => {
          for(let i = record.start_ayah; i <= record.end_ayah; i++) {
            uniqueAyahs.add(`${record.surah_number}-${i}`);
          }
        });
        
        totalAyahs = uniqueAyahs.size;
        let percentage = Math.round((totalAyahs / totalQuranAyahs) * 100);
        if (percentage > 100) percentage = 100;

        let status = 'Beginner';
        let statusColor = 'text-primary';
        let barColor = 'bg-primary';

        if (percentage > 20 && percentage <= 50) {
          status = 'Intermediate';
          statusColor = 'text-blue-400';
          barColor = 'bg-blue-400';
        } else if (percentage > 50 && percentage <= 80) {
          status = 'Advanced';
          statusColor = 'text-purple-400';
          barColor = 'bg-purple-400';
        } else if (percentage > 80) {
          status = 'Expert';
          statusColor = 'text-green-400';
          barColor = 'bg-green-400';
        } else if (percentage === 0 && records.length > 0) {
          status = 'Started';
        } else if (percentage === 0) {
           status = 'New';
           statusColor = 'text-text-muted';
           barColor = 'bg-text-muted';
        }

        progress = { percentage, status, statusColor, barColor };

        const latestRecord = records[0];
        if (latestRecord.surah) {
          currentLevel = {
            juz: 30,
            surah: latestRecord.surah.name
          };
        }
      }

      return {
        ...userJSON,
        lastSession,
        currentLevel,
        progress
      };
    });
  } catch (error) {
    throw error;
  }
};

export const searchUsers = async (query: string, tenant_id?: number) => {
  try {
    const where: any = {
      [Op.or]: [
        { first_name: { [Op.like]: `%${query}%` } },
        { last_name: { [Op.like]: `%${query}%` } },
        { email: { [Op.like]: `%${query}%` } },
        { phone: { [Op.like]: `%${query}%` } }
      ]
    };

    if (tenant_id) {
      where.tenant_id = tenant_id;
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

export const getStudentProfile = async (id: number, tenant_id: number) => {
  try {
    const user = await User.findOne({
      where: { id, tenant_id, role: UserRole.STUDENT },
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
    
    // 1. Calculate Attendance Rate
    const attendanceRecords = await Attendance.findAll({
      include: [{
        model: Session,
        as: 'session',
        where: { student_id: id, tenant_id },
        required: true
      }]
    });
    
    const totalSessions = attendanceRecords.length;
    const presentSessions = attendanceRecords.filter((a: any) => a.status === 'present').length;
    const attendanceRate = totalSessions > 0 ? Math.round((presentSessions / totalSessions) * 100) : 0;

    // 2. Calculate Progress Metrics
    const totalQuranAyahs = 6236;
    const memorizationRecords = await MemorizationRecord.findAll({
      where: { student_id: id, tenant_id },
      attributes: ['surah_number', 'start_ayah', 'end_ayah']
    });

    const uniqueAyahs = new Set();
    memorizationRecords.forEach((record: any) => {
      for(let i = record.start_ayah; i <= record.end_ayah; i++) {
        uniqueAyahs.add(`${record.surah_number}-${i}`);
      }
    });
    
    const totalAyahsMemorized = uniqueAyahs.size;
    const completionPercentage = Math.round((totalAyahsMemorized / totalQuranAyahs) * 100);

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
    }).flat().slice(0, 10);

    // 4. Mastery Data (Detailed Objects for all 114 Surahs)
    const allSurahs = await Surah.findAll({ order: [['number', 'ASC']] });
    const memorizationRecordsAll = await MemorizationRecord.findAll({
      where: { student_id: id, tenant_id },
      attributes: ['surah_number', 'start_ayah', 'end_ayah']
    });
    const revisionRecordsAll = await RevisionRecord.findAll({
      where: { student_id: id, tenant_id },
      attributes: ['surah_number', 'start_ayah', 'end_ayah']
    });

    const masteryData = allSurahs.map(surah => {
      const sNum = surah.number;
      const mRecords = memorizationRecordsAll.filter(r => r.surah_number === sNum);
      const rRecords = revisionRecordsAll.filter(r => r.surah_number === sNum);

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

    // 5. Velocity Data (Last 8 Weeks)
    const velocityData = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7 + now.getDay()));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      const weekRecords = memorizationRecordsAll.filter(r => {
        const recordDate = new Date((r as any).created_at || now); // Fallback to now if created_at is missing in query
        return recordDate >= weekStart && recordDate <= weekEnd;
      });

      let totalAyahs = 0;
      weekRecords.forEach(r => {
        totalAyahs += (r.end_ayah - r.start_ayah + 1);
      });

      // Rough estimation: 10 ayahs per page
      const pages = Math.round((totalAyahs / 10) * 10) / 10; 
      
      velocityData.push({
        week: `W${8-i}`,
        pages: pages || 0
      });
    }

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
