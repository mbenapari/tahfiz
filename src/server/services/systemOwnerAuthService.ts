import logger from '../utils/logger';
import { SystemOwner, BlacklistedToken } from '../model';
import bcrypt from 'bcrypt';
import * as jwtHelper from '../helper/jwtHelper';
import { generateBlindIndex } from '../utils/crypto';
import { bruteForceService } from '../utils/bruteForceService';
import jwt from 'jsonwebtoken';
import { Response } from 'express';

export const loginSystemOwner = async (email: string, password: string, res?: Response) => {
  logger.debug('systemOwnerAuthService.loginSystemOwner: Entry', { email });
  try {
    if (!email || !password) throw new Error('Email and password are required');

    // Brute-force protection check
    const lockout = bruteForceService.isLockedOut(email);
    if (lockout.locked) {
      const minutes = Math.ceil(lockout.remainingMs / 60000);
      throw new Error(`Account is temporarily locked. Please try again in ${minutes} minutes.`);
    }

    const emailBlindIndex = generateBlindIndex(email);
    const owner = await SystemOwner.findOne({ where: { email_blind_index: emailBlindIndex } });
    if (!owner) {
      await bcrypt.hash(password, 12);
      bruteForceService.recordFailedAttempt(email);
      throw new Error('Invalid credentials');
    }

    const valid = await owner.validatePassword(password);
    if (!valid) {
      bruteForceService.recordFailedAttempt(email);
      throw new Error('Invalid credentials');
    }

    // Reset brute-force attempts on successful login
    bruteForceService.resetAttempts(email);

    // Sign token. Reuse jwt payload structure: userId, roleId, tenantId
    const token = jwtHelper.signToken({ userId: owner.id, roleId: 0, tenantId: 0 });

    if (res) jwtHelper.setAuthCookie(res, token);

    logger.info('systemOwnerAuthService.loginSystemOwner: Success', { ownerId: owner.id });
    return { owner, token };
  } catch (error: any) {
    logger.warn('systemOwnerAuthService.loginSystemOwner: Failed', { email, error: error.message });
    throw error;
  }
};

export const logoutSystemOwner = async (token: string | undefined, res?: Response) => {
  logger.debug('systemOwnerAuthService.logoutSystemOwner: Entry');
  try {
    if (!token) {
      if (res) jwtHelper.clearAuthCookie(res);
      return;
    }

    // Decode token to get expiration
    const decoded: any = jwt.decode(token);
    const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 24 * 60 * 60 * 1000);

    await BlacklistedToken.create({ token, expires_at: expiresAt });

    if (res) jwtHelper.clearAuthCookie(res);
    logger.info('systemOwnerAuthService.logoutSystemOwner: Token blacklisted');
    return true;
  } catch (error: any) {
    logger.error('systemOwnerAuthService.logoutSystemOwner: Error', { error: error.message });
    // still clear cookie if response provided
    if (res) jwtHelper.clearAuthCookie(res);
    throw error;
  }
};

export default {
  loginSystemOwner,
  logoutSystemOwner
};
