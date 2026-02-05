import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

/**
 * Basic in-memory rate limiter middleware.
 * @param windowMs Time window in milliseconds
 * @param max Max requests per window
 */
export const rateLimit = (windowMs: number, max: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!store[ip] || now > store[ip].resetTime) {
      store[ip] = {
        count: 1,
        resetTime: now + windowMs,
      };
      return next();
    }

    store[ip].count++;

    if (store[ip].count > max) {
      return res.status(429).json({
        error: 'Too many requests, please try again later.',
      });
    }

    next();
  };
};
