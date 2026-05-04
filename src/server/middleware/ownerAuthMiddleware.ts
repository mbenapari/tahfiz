import { Request, Response, NextFunction } from 'express';
import { SystemOwner } from '../model';
import logger from '../utils/logger';

export const ownerOnly = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!(req as any).user) return res.status(401).json({ error: 'Not authenticated' });
    const userId = (req as any).user.userId;
    const owner = await SystemOwner.findByPk(userId);
    if (!owner) {
      logger.warn('ownerOnly: Access denied, user not a system owner', { userId });
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  } catch (error: any) {
    logger.error('ownerOnly middleware error', { error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
};

export default ownerOnly;
