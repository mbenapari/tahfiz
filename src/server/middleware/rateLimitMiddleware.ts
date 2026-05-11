import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // sweep every 5 minutes
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

const sweep = () => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) store.delete(key);
  }
};

const startCleanup = () => {
  if (!cleanupTimer) {
    cleanupTimer = setInterval(sweep, CLEANUP_INTERVAL_MS);
    cleanupTimer.unref?.();
  }
};

startCleanup();

/**
 * Basic in-memory rate limiter middleware with bounded memory usage.
 * Expired entries are lazily evicted on access and fully swept every 5 minutes.
 * @param windowMs Time window in milliseconds
 * @param max Max requests per window
 */
export const rateLimit = (windowMs: number, max: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    const entry = store.get(ip);

    if (!entry || now > entry.resetTime) {
      store.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    entry.count++;
    store.set(ip, entry);

    if (entry.count > max) {
      return res.status(429).json({
        error: 'Too many requests, please try again later.',
      });
    }

    next();
  };
};
