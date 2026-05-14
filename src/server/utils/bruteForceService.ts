import { BRUTE_FORCE_MAX_ATTEMPTS, BRUTE_FORCE_LOCKOUT_MS } from '../constants';
import logger from './logger';

interface LockoutEntry {
  attempts: number;
  lockoutUntil: number | null;
}

// In-memory store for failed attempts
// In a production environment with multiple instances, this should be replaced with Redis.
const failedAttemptsStore = new Map<string, LockoutEntry>();

/**
 * Cleanup expired entries periodically to prevent memory leaks
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of failedAttemptsStore.entries()) {
    if (entry.lockoutUntil && now > entry.lockoutUntil) {
      failedAttemptsStore.delete(key);
    } else if (!entry.lockoutUntil && entry.attempts === 0) {
      failedAttemptsStore.delete(key);
    }
  }
}, 10 * 60 * 1000).unref(); // Every 10 minutes

/**
 * Service to track and manage brute-force protection
 */
export const bruteForceService = {
  /**
   * Records a failed login attempt for a given key (e.g., email or blind index)
   */
  recordFailedAttempt: (key: string): void => {
    const entry = failedAttemptsStore.get(key) || { attempts: 0, lockoutUntil: null };
    
    entry.attempts += 1;
    
    if (entry.attempts >= BRUTE_FORCE_MAX_ATTEMPTS) {
      entry.lockoutUntil = Date.now() + BRUTE_FORCE_LOCKOUT_MS;
      logger.warn('Brute-force protection: Account locked', { key, attempts: entry.attempts });
    }
    
    failedAttemptsStore.set(key, entry);
  },

  /**
   * Resets failed attempts for a given key upon successful login
   */
  resetAttempts: (key: string): void => {
    failedAttemptsStore.delete(key);
  },

  /**
   * Checks if a key is currently locked out
   * @returns { success: boolean, message?: string }
   */
  isLockedOut: (key: string): { locked: boolean; remainingMs: number } => {
    const entry = failedAttemptsStore.get(key);
    
    if (!entry || !entry.lockoutUntil) {
      return { locked: false, remainingMs: 0 };
    }
    
    const now = Date.now();
    if (now > entry.lockoutUntil) {
      failedAttemptsStore.delete(key);
      return { locked: false, remainingMs: 0 };
    }
    
    return { 
      locked: true, 
      remainingMs: entry.lockoutUntil - now 
    };
  }
};
