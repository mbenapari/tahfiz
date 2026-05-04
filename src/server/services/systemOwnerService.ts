import logger from '../utils/logger';
import { SystemOwner, Role } from '../model';

export interface CreateSystemOwnerDTO {
  name: string;
  email: string;
  phone?: string | null;
  role: 'sys_admin' | 'super';
}

export interface UpdateSystemOwnerDTO {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: 'sys_admin' | 'super';
}

export const createSystemOwner = async (data: CreateSystemOwnerDTO, transaction?: any) => {
  logger.debug('systemOwnerService.createSystemOwner: Entry', { email: data.email });
  try {
    // Prevent duplicates
    const existing = await SystemOwner.findOne({ where: { email: data.email }, transaction });
    if (existing) {
      throw new Error('System owner with this email already exists');
    }

    // Optional: ensure role exists in roles table (best-effort)
    try {
      const roleSlug = data.role;
      const roleRecord = await Role.findOne({ where: { slug: roleSlug }, transaction });
      if (!roleRecord) {
        logger.warn('systemOwnerService.createSystemOwner: Role slug not found in roles table', { role: roleSlug });
      }
    } catch (err) {
      logger.debug('systemOwnerService.createSystemOwner: role check skipped', { error: (err as Error).message });
    }

    const owner = await SystemOwner.create(data as any, { transaction });
    logger.info('systemOwnerService.createSystemOwner: Created', { id: owner.id, email: owner.email });
    return owner;
  } catch (error: any) {
    logger.error('systemOwnerService.createSystemOwner: Error', { error: error.message });
    throw error;
  }
};

export const getSystemOwnerById = async (id: number) => {
  logger.debug('systemOwnerService.getSystemOwnerById: Entry', { id });
  try {
    const owner = await SystemOwner.findByPk(id);
    if (!owner) throw new Error('System owner not found');
    return owner;
  } catch (error: any) {
    logger.error('systemOwnerService.getSystemOwnerById: Error', { id, error: error.message });
    throw error;
  }
};

export const getSystemOwnerByEmail = async (email: string) => {
  logger.debug('systemOwnerService.getSystemOwnerByEmail: Entry', { email });
  try {
    const owner = await SystemOwner.findOne({ where: { email } });
    return owner;
  } catch (error: any) {
    logger.error('systemOwnerService.getSystemOwnerByEmail: Error', { email, error: error.message });
    throw error;
  }
};

export const getAllSystemOwners = async (options: any = {}) => {
  logger.debug('systemOwnerService.getAllSystemOwners: Entry');
  try {
    const owners = await SystemOwner.findAll(options);
    return owners;
  } catch (error: any) {
    logger.error('systemOwnerService.getAllSystemOwners: Error', { error: error.message });
    throw error;
  }
};

export const updateSystemOwner = async (id: number, data: UpdateSystemOwnerDTO, transaction?: any) => {
  logger.debug('systemOwnerService.updateSystemOwner: Entry', { id });
  try {
    const owner = await SystemOwner.findByPk(id, { transaction });
    if (!owner) throw new Error('System owner not found');

    await owner.update(data as any, { transaction });
    logger.info('systemOwnerService.updateSystemOwner: Updated', { id });
    return owner;
  } catch (error: any) {
    logger.error('systemOwnerService.updateSystemOwner: Error', { id, error: error.message });
    throw error;
  }
};

export const deleteSystemOwner = async (id: number, transaction?: any) => {
  logger.debug('systemOwnerService.deleteSystemOwner: Entry', { id });
  try {
    const owner = await SystemOwner.findByPk(id, { transaction });
    if (!owner) throw new Error('System owner not found');
    await owner.destroy({ transaction });
    logger.info('systemOwnerService.deleteSystemOwner: Deleted', { id });
    return true;
  } catch (error: any) {
    logger.error('systemOwnerService.deleteSystemOwner: Error', { id, error: error.message });
    throw error;
  }
};
