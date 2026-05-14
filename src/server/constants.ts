/**
 * Shared constants for the application
 */

// Quran Constants
export const TOTAL_QURAN_AYAHS = 6236;

// Security and Authentication Constants
export const COOKIE_MAX_AGE = 24 * 60 * 60 * 1000; // 1 day
export const JWT_EXPIRES_IN = '1d';

// Pagination Constants
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Performance Constants
export const PERMISSION_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
export const BLACKLIST_CACHE_REFRESH_MS = 5 * 60 * 1000; // 5 minutes
export const RATE_LIMIT_CLEANUP_MS = 5 * 60 * 1000; // 5 minutes

// Redis Configuration
export const REDIS_URL = process.env.REDIS_URL;
export const USE_REDIS = !!REDIS_URL;

// Business Logic Constants
export const VELOCITY_BUCKET_SIZE = 10;
export const RECENT_ACTIVITY_LIMIT = 10;
export const BRUTE_FORCE_MAX_ATTEMPTS = 5;
export const BRUTE_FORCE_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes
