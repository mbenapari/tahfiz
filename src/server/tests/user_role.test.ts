import assert from 'node:assert';
import { User, Role } from '../model';
import * as userService from '../services/userService';
import { UserRole } from '../model/User';
import sequelize from '../db';

async function runUserRoleTests() {
  console.log('Running User Role Assignment Tests...');
  const testEmail = `role_test_${Date.now()}@example.com`;
  
  try {
    // Ensure roles exist (idempotent check)
    await Role.findOrCreate({ 
      where: { slug: 'student' },
      defaults: { name: 'Student', slug: 'student', description: 'Student' }
    });

    // Test 1: Create User should automatically assign role_id
    console.log('Test 1: Create User with valid role...');
    const userData: userService.CreateUserDTO = {
      tenant_id: 1,
      first_name: 'Role',
      last_name: 'Test',
      email: testEmail,
      password: 'Password123!',
      role: UserRole.STUDENT,
      phone: '1234567890'
    };

    const newUser = await userService.createUser(userData);
    
    assert.ok(newUser.role_id, 'role_id MUST be assigned');
    console.log(`User created with role_id: ${newUser.role_id}`);
    
    // Verify it matches the role in DB
    const studentRole = await Role.findOne({ where: { slug: 'student' } });
    assert.strictEqual(newUser.role_id, studentRole?.id, 'Assigned role_id matches Role table');

    console.log('✅ Role assignment passed.');

    // Cleanup
    await newUser.destroy({ force: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Don't close sequelize if running in a larger suite, but here we are standalone-ish
    // await sequelize.close(); 
  }
}

if (import.meta.url.endsWith('user_role.test.ts')) {
  runUserRoleTests();
}
