import assert from 'node:assert';
import * as statsService from '../services/statsService';

// Mocking some database behavior would be complex without a proper test suite,
// but we can at least verify the service structure and types.

async function runTests() {
  console.log('Running Statistics Service Unit Tests...');

  try {
    // Test getActiveStudentsCount
    assert.strictEqual(typeof statsService.getActiveStudentsCount, 'function', 'getActiveStudentsCount should be a function');
    
    // Test getTotalHifzJuz
    assert.strictEqual(typeof statsService.getTotalHifzJuz, 'function', 'getTotalHifzJuz should be a function');

    // Test getTodaySessionsStats
    assert.strictEqual(typeof statsService.getTodaySessionsStats, 'function', 'getTodaySessionsStats should be a function');

    // Test getPendingReviewsCount
    assert.strictEqual(typeof statsService.getPendingReviewsCount, 'function', 'getPendingReviewsCount should be a function');

    console.log('✅ All service methods are defined and exported correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Only run if called directly
if (import.meta.url.endsWith('stats.test.ts')) {
  runTests();
}

export { runTests };
