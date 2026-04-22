import { Request, Response, NextFunction } from 'express';

const cache = new Map<string, { data: any, expiry: number }>();

/**
 * Simple in-memory cache middleware
 * @param duration Duration in seconds
 */
export const cacheMiddleware = (duration: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.user?.tenantId}-${req.originalUrl || req.url}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse && cachedResponse.expiry > Date.now()) {
      return res.json(cachedResponse.data);
    }

    // Override res.json to capture the response data
    const originalJson = res.json;
    res.json = (data: any) => {
      cache.set(key, {
        data,
        expiry: Date.now() + duration * 1000
      });
      return originalJson.call(res, data);
    };

    next();
  };
};

/**
 * Clear cache for a specific tenant
 */
export const clearTenantCache = (tenantId: number) => {
  for (const key of cache.keys()) {
    if (key.startsWith(`${tenantId}-`)) {
      cache.delete(key);
    }
  }
};
