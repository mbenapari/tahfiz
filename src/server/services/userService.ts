import { FindOptions } from 'sequelize';
import { User } from '../model';
import { UserRole } from '../model/User';

export interface CreateUserDTO {
  tenant_id: number;
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role: UserRole;
  student_identifier?: string;
}

export interface UpdateUserDTO {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  student_identifier?: string;
}

export const createUser = async (data: CreateUserDTO) => {
  try {
    const user = await User.create(data);
    return user;
  } catch (error) {
    throw error;
  }
};

export const getUserById = async (id: number, tenant_id: number) => {
  try {
    const user = await User.findOne({
      where: { id, tenant_id },
    });
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  } catch (error) {
    throw error;
  }
};

export const getUserByEmail = async (email: string, tenant_id: number) => {
  try {
    const user = await User.findOne({
      where: { email, tenant_id },
    });
    return user;
  } catch (error) {
    throw error;
  }
};

export const getAllUsers = async (tenant_id: number, options?: FindOptions) => {
  try {
    const users = await User.findAll({
      where: { tenant_id },
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
      where: { tenant_id, role },
    });
    return users;
  } catch (error) {
    throw error;
  }
};

export const updateUser = async (id: number, tenant_id: number, data: UpdateUserDTO) => {
  try {
    const user = await getUserById(id, tenant_id);
    await user.update(data);
    return user;
  } catch (error) {
    throw error;
  }
};

export const deleteUser = async (id: number, tenant_id: number) => {
  try {
    const user = await getUserById(id, tenant_id);
    await user.destroy();
    return true;
  } catch (error) {
    throw error;
  }
};
