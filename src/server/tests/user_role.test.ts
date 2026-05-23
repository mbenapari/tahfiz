import { Role, School } from '../model';
import * as userService from '../services/userService';
import { UserRole } from '../model/User';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('User Role Assignment', () => {
  const testEmail = `role_test_${Date.now()}@example.com`;
  let createdUser: any = null;
  let testSchool: any = null;

  beforeAll(async () => {
    // Ensure 'student' role exists
    await Role.findOrCreate({
      where: { slug: 'student' },
      defaults: { name: 'Student', slug: 'student', description: 'Student' }
    });

    // Create a test school
    testSchool = await School.create({
      name: 'Role Test School',
      slug: `role-test-school-${Date.now()}`,
      timezone: 'UTC',
      study_days: [1, 2, 3, 4, 5]
    });
  });

  afterAll(async () => {
    if (createdUser && createdUser.destroy) {
      await createdUser.destroy({ force: true });
    }
    if (testSchool && testSchool.destroy) {
      await testSchool.destroy({ force: true });
    }
  });

  it('creates user and assigns role_id based on role slug', async () => {
    const userData: userService.CreateUserDTO = {
      tenant_id: testSchool.id,
      first_name: 'Role',
      last_name: 'Test',
      email: testEmail,
      password: 'Password123!',
      role: UserRole.STUDENT,
      phone: '1234567890'
    };

    const newUser = await userService.createUser(userData);
    createdUser = newUser;

    expect(newUser.role_id).toBeDefined();

    const studentRole = await Role.findOne({ where: { slug: 'student' } });
    expect(studentRole).not.toBeNull();
    expect(newUser.role_id).toBe(studentRole!.id);
  }, 10000);
});
