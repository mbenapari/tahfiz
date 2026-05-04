import logger from '../utils/logger';
import { User, SystemOwner, School } from '../model';

export const getPlatformMetrics = async () => {
  logger.debug('platformMetricsService.getPlatformMetrics: Entry');
  try {
    const [totalUsers, totalSystemOwners, totalSchools] = await Promise.all([
      User.count(),
      SystemOwner.count(),
      School.count()
    ]);

    return {
      totalUsers,
      totalSystemOwners,
      totalSchools
    };
  } catch (error: any) {
    logger.error('platformMetricsService.getPlatformMetrics: Error', { error: error.message });
    throw error;
  }
};

export default {
  getPlatformMetrics
};
