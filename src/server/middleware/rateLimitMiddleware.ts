import { rateLimit as expressRateLimit } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { USE_REDIS, REDIS_URL } from '../constants';
import logger from '../utils/logger';

// Initialize Redis client if enabled
const redisClient = USE_REDIS ? new Redis(REDIS_URL!) : null;

if (redisClient) {
  redisClient.on('error', (err) => logger.error('Redis Client Error', { error: err.message }));
  redisClient.on('connect', () => logger.info('Redis Client Connected for Rate Limiting'));
}

/**
 * Robust rate limiter middleware using express-rate-limit.
 * Automatically switches to Redis store in production/multi-instance environments.
 * @param windowMs Time window in milliseconds
 * @param max Max requests per window
 */
export const rateLimit = (windowMs: number, max: number) => {
  const store = redisClient 
    ? new RedisStore({
        // @ts-expect-error - ioredis types mismatch with rate-limit-redis but it works
        sendCommand: (...args: string[]) => redisClient.call(...args),
      })
    : undefined;

  return expressRateLimit({
    windowMs,
    max,
    store,
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: {
      error: 'Too many requests, please try again later.'
    },
    // Use default key generator (IP-based) which handles IPv6 normalization correctly
  });
};
