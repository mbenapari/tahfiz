import assert from 'node:assert';
import bcrypt from 'bcrypt';
import { User, UserRole } from '../model/User';
import * as userService from '../services/userService';
import sequelize from '../db';

// Mock request/response for controller tests would be here, 
// but for security verification, testing the Service/Model layer is most critical 
// to ensure hashing happens before storage.

async function runAuthSecurityTests() {
  console.log('Running Authentication Security Tests...');
  const testEmail = `test_security_${Date.now()}@example.com`;
  const plainPassword = 'StrongPassword123!';
  let userId: number;

  try {
    // Sync DB (careful not to drop tables in production, but this is a test script)
    // We assume DB is up.
    
    // --- Test Case 1: Password Hashing on Creation ---
    console.log('Test 1: Verifying password hashing on user creation...');
    
    const userData: userService.CreateUserDTO = {
      tenant_id: 1,
      first_name: 'Security',
      last_name: 'Test',
      email: testEmail,
      password: plainPassword,
      role: UserRole.STUDENT,
      phone: '1234567890'
    };

    const newUser = await userService.createUser(userData);
    userId = newUser.id;

    assert.ok(newUser.password, 'Password should exist');
    assert.notStrictEqual(newUser.password, plainPassword, 'Password MUST NOT be stored in plain text');
    assert.ok(newUser.password.startsWith('$2b$12$'), 'Password MUST be hashed with bcrypt cost 12');
    
    console.log('✅ Password hashing verification passed.');

    // --- Test Case 2: Login/Password Verification ---
    console.log('Test 2: Verifying password validation...');
    
    // Fetch user from DB to ensure we are testing persistence
    const fetchedUser = await User.findByPk(userId);
    assert.ok(fetchedUser, 'User should be retrievable');
    
    // Positive case
    const isValid = await fetchedUser!.validatePassword(plainPassword);
    assert.strictEqual(isValid, true, 'Valid password should verify successfully');
    
    // Negative case
    const isInvalid = await fetchedUser!.validatePassword('WrongPassword');
    assert.strictEqual(isInvalid, false, 'Invalid password should be rejected');

    console.log('✅ Password verification logic passed.');

    // --- Test Case 3: Performance Check ---
    console.log('Test 3: Checking login performance (hashing time)...');
    
    const start = Date.now();
    await fetchedUser!.validatePassword(plainPassword);
    const duration = Date.now() - start;
    
    console.log(`Login verification took ${duration}ms`);
    assert.ok(duration < 500, 'Login verification should be under 500ms');
    
    console.log('✅ Performance check passed.');

    // Cleanup
    await fetchedUser!.destroy({ force: true });
    console.log('Cleanup completed.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (import.meta.url.endsWith('auth_security.test.ts')) {
  runAuthSecurityTests();
}
