import { FindOptions } from 'sequelize';
import { User, Role, SchoolMember, School } from '../model';
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
    const user = await User.findByPk(id);
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
      where: { role },
      include: [{
        model: SchoolMember,
        where: { school_id: tenant_id },
        required: true
      }]
    });
    return users;
  } catch (error) {
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
