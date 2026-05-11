import { describe, it, expect } from '@jest/globals';
import * as statsService from '../services/statsService';

describe('Statistics Service', () => {
  it('should define expected service methods', () => {
    expect(typeof statsService.getActiveStudentsCount).toBe('function');
    expect(typeof statsService.getTotalHifzJuz).toBe('function');
    expect(typeof statsService.getTodaySessionsStats).toBe('function');
    expect(typeof statsService.getPendingReviewsCount).toBe('function');
  });
});
