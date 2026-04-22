import assert from 'node:assert';
import { User, Role, School } from '../model';
import * as userService from '../services/userService';
import * as permissionService from '../services/permissionService';
import { UserRole } from '../model/User';
import sequelize from '../db';

async function runUserControllerTests() {
  console.log('Running User Controller Tests...');
  const testEmail = `instructor_test_${Date.now()}@example.com`;

  try {
    // Ensure roles exist
    await Role.findOrCreate({
      where: { slug: 'admin' },
      defaults: { name: 'Admin', slug: 'admin', description: 'Institution Administrator' }
    });
    await Role.findOrCreate({
      where: { slug: 'instructor' },
      defaults: { name: 'Instructor', slug: 'instructor', description: 'Teacher/Instructor' }
    });

    // Ensure a test school exists
    let testSchool = await School.findOne({ where: { slug: 'test-school' } });
    if (!testSchool) {
      testSchool = await School.create({
        name: 'Test School',
        slug: 'test-school',
        timezone: 'UTC',
        study_days: [1, 2, 3, 4, 5], // Monday to Friday
      });
    }

    // Create a test admin user
    const adminData: userService.CreateUserDTO = {
      tenant_id: testSchool.id,
      first_name: 'Test',
      last_name: 'Admin',
      email: `admin_${Date.now()}@example.com`,
      password: 'Password123!',
      role: UserRole.ADMIN,
      phone: '1234567890'
    };
    const adminUser = await userService.createUser(adminData);

    // Test 1: Create Instructor should work for admin
    console.log('Test 1: Create Instructor with valid data...');
    const instructorData: userService.CreateUserDTO = {
      tenant_id: testSchool.id,
      first_name: 'Test',
      last_name: 'Instructor',
      email: testEmail,
      password: 'Password123!',
      role: UserRole.INSTRUCTOR,
      phone: '0987654321'
    };

    const newInstructor = await userService.createUser(instructorData);

    assert.ok(newInstructor.id, 'Instructor should be created with an ID');
    assert.strictEqual(newInstructor.role, UserRole.INSTRUCTOR, 'Role should be INSTRUCTOR');
    assert.strictEqual(newInstructor.tenant_id, testSchool.id, 'Tenant ID should match');
    assert.strictEqual(newInstructor.email, testEmail, 'Email should match');

    console.log('✅ Create Instructor test passed.');

    // Test 2: Permission check should work
    console.log('Test 2: Permission check for admin...');
    const hasPermission = await permissionService.hasPermission(adminUser.id, 'users:manage');
    assert.ok(hasPermission, 'Admin should have users:manage permission');

    console.log('✅ Permission test passed.');

    // Test 3: Duplicate email should fail
    console.log('Test 3: Duplicate email should fail...');
    let errorThrown = false;
    try {
      const duplicateData: userService.CreateUserDTO = {
        tenant_id: testSchool.id,
        first_name: 'Another',
        last_name: 'Instructor',
        email: testEmail, // Same email
        password: 'Password123!',
        role: UserRole.INSTRUCTOR,
        phone: '1111111111'
      };
      await userService.createUser(duplicateData);
    } catch (error: any) {
      errorThrown = true;
      assert.ok(error.message.includes('Validation error') || error.message.includes('duplicate') || error.message.includes('unique'), `Error should indicate duplicate: ${error.message}`);
    }
    assert.ok(errorThrown, 'Should have thrown error for duplicate email');

    console.log('✅ Duplicate email test passed.');

    // Cleanup
    await newInstructor.destroy({ force: true });
    await adminUser.destroy({ force: true });

    // Test 4: Get instructor by ID
    console.log('Test 4: Get instructor by ID...');
    const instructor2Data: userService.CreateUserDTO = {
      tenant_id: testSchool.id,
      first_name: 'fetch',
      last_name: 'test',
      email: `fetch_test_${Date.now()}@example.com`,
      password: 'Password123!',
      role: UserRole.INSTRUCTOR,
    };
    const instructor2 = await userService.createUser(instructor2Data);
    const fetchedInstructor = await userService.getUserById(instructor2.id);
    assert.strictEqual(fetchedInstructor.id, instructor2.id, 'Fetched instructor should match');
    assert.strictEqual(fetchedInstructor.role, UserRole.INSTRUCTOR, 'Role should be INSTRUCTOR');
    console.log('✅ Get instructor test passed.');

    // Test 5: Update instructor
    console.log('Test 5: Update instructor...');
    const updateData: userService.UpdateUserDTO = {
      first_name: 'Updated',
      last_name: 'Name',
      email: `updated_${Date.now()}@example.com`,
      phone: '9999999999',
    };
    const updatedInstructor = await userService.updateUser(instructor2.id, updateData);
    assert.strictEqual(updatedInstructor.first_name, 'Updated', 'First name should be updated');
    assert.strictEqual(updatedInstructor.phone, '9999999999', 'Phone should be updated');
    console.log('✅ Update instructor test passed.');

    // Test 6: Get all instructors for tenant
    console.log('Test 6: Get all instructors for tenant...');
    const allInstructors = await userService.getInstructorsByTenant(testSchool.id);
    assert.ok(allInstructors.length >= 1, 'Should have at least one instructor');
    assert.ok(allInstructors.some(i => i.id === instructor2.id), 'Updated instructor should be in list');
    console.log('✅ Get all instructors test passed.');

    // Cleanup
    await instructor2.destroy({ force: true });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (import.meta.url.endsWith('userController.test.ts')) {
  runUserControllerTests();
}