import { Request, Response } from 'express';
import * as schoolService from '../services/schoolService';
import * as userService from '../services/userService';
import * as ownerService from '../services/systemOwnerService';
import logger from '../utils/logger';

/* Schools */
export const listSchools = async (_req: Request, res: Response) => {
  try {
    const schools = await schoolService.getAllSchools();
    res.json(schools);
  } catch (error: any) {
    logger.error('ownerManagement.listSchools error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const createSchool = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const school = await schoolService.createSchool(payload);
    res.status(201).json(school);
  } catch (error: any) {
    logger.error('ownerManagement.createSchool error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const updateSchool = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const payload = req.body;
    const school = await schoolService.updateSchool(id, payload);
    res.json(school);
  } catch (error: any) {
    logger.error('ownerManagement.updateSchool error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const deleteSchool = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await schoolService.deleteSchool(id);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('ownerManagement.deleteSchool error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/* Users */
export const listUsers = async (_req: Request, res: Response) => {
  try {
    // Platform-wide users
    const users = await (userService as any).getAllPlatformUsers?.() ?? [];
    res.json(users);
  } catch (error: any) {
    logger.error('ownerManagement.listUsers error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const user = await userService.createUser(payload as any);
    res.status(201).json(user);
  } catch (error: any) {
    logger.error('ownerManagement.createUser error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const payload = req.body;
    const user = await userService.updateUser(id, payload as any);
    res.json(user);
  } catch (error: any) {
    logger.error('ownerManagement.updateUser error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    // Soft delete via User model
    await (userService as any).deleteUserById(id);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('ownerManagement.deleteUser error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

/* System Owners */
export const listOwners = async (_req: Request, res: Response) => {
  try {
    const owners = await ownerService.getAllSystemOwners();
    res.json(owners);
  } catch (error: any) {
    logger.error('ownerManagement.listOwners error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const createOwner = async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    const owner = await ownerService.createSystemOwner(payload as any);
    res.status(201).json(owner);
  } catch (error: any) {
    logger.error('ownerManagement.createOwner error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const updateOwner = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const payload = req.body;
    const owner = await ownerService.updateSystemOwner(id, payload as any);
    res.json(owner);
  } catch (error: any) {
    logger.error('ownerManagement.updateOwner error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export const deleteOwner = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await ownerService.deleteSystemOwner(id);
    res.json({ success: true });
  } catch (error: any) {
    logger.error('ownerManagement.deleteOwner error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

export default {
  listSchools,
  createSchool,
  updateSchool,
  deleteSchool,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listOwners,
  createOwner,
  updateOwner,
  deleteOwner,
};
