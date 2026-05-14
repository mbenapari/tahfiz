import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { Role, School } from '../model';
import * as userService from '../services/userService';
import * as permissionService from '../services/permissionService';
import { UserRole } from '../model/User';
import { decrypt } from '../utils/crypto';

describe('User Controller Test Suite', () => {
  const testEmail = `instructor_test_${Date.now()}@example.com`;
  let testSchool: any;
  let adminUser: any;
  let newInstructor: any;
  let instructor2: any;

  beforeAll(async () => {
    await Role.findOrCreate({
      where: { slug: 'admin' },
      defaults: { name: 'Admin', slug: 'admin', description: 'Institution Administrator' }
    });
    await Role.findOrCreate({
      where: { slug: 'instructor' },
      defaults: { name: 'Instructor', slug: 'instructor', description: 'Teacher/Instructor' }
    });

    testSchool = await School.findOne({ where: { slug: 'test-school' } });
    if (!testSchool) {
      testSchool = await School.create({
        name: 'Test School',
        slug: 'test-school',
        timezone: 'UTC',
        study_days: [1, 2, 3, 4, 5]
      });
    }
  });

  afterAll(async () => {
    if (newInstructor?.destroy) await newInstructor.destroy({ force: true });
    if (instructor2?.destroy) await instructor2.destroy({ force: true });
    if (adminUser?.destroy) await adminUser.destroy({ force: true });
  });

  it('should create instructors, enforce duplicates, retrieve and update records', async () => {
    const adminData: userService.CreateUserDTO = {
      tenant_id: testSchool.id,
      first_name: 'Test',
      last_name: 'Admin',
      email: `admin_${Date.now()}@example.com`,
      password: 'Password123!',
      role: UserRole.ADMIN,
      phone: '1234567890'
    };
    adminUser = await userService.createUser(adminData);

    const instructorData: userService.CreateUserDTO = {
      tenant_id: testSchool.id,
      first_name: 'Test',
      last_name: 'Instructor',
      email: testEmail,
      password: 'Password123!',
      role: UserRole.INSTRUCTOR,
      phone: '0987654321'
    };
    newInstructor = await userService.createUser(instructorData);

    expect(newInstructor.id).toBeDefined();
    expect(newInstructor.role).toBe(UserRole.INSTRUCTOR);
    expect(newInstructor.tenant_id).toBe(testSchool.id);
    expect(decrypt(newInstructor.email)).toBe(testEmail);

    const hasPermission = await permissionService.hasPermission(adminUser.id, 'users:manage');
    expect(hasPermission).toBe(true);

    await expect(userService.createUser({
      tenant_id: testSchool.id,
      first_name: 'Another',
      last_name: 'Instructor',
      email: testEmail,
      password: 'Password123!',
      role: UserRole.INSTRUCTOR,
      phone: '1111111111'
    })).rejects.toThrow(/(Validation error|duplicate|unique|already registered)/i);

    instructor2 = await userService.createUser({
      tenant_id: testSchool.id,
      first_name: 'fetch',
      last_name: 'test',
      email: `fetch_test_${Date.now()}@example.com`,
      password: 'Password123!',
      role: UserRole.INSTRUCTOR
    });

    const fetchedInstructor = await userService.getUserById(instructor2.id);
    expect(fetchedInstructor.id).toBe(instructor2.id);
    expect(fetchedInstructor.role).toBe(UserRole.INSTRUCTOR);

    const updatedInstructor = await userService.updateUser(instructor2.id, {
      first_name: 'Updated',
      last_name: 'Name',
      email: `updated_${Date.now()}@example.com`,
      phone: '9999999999'
    });

    expect(updatedInstructor.first_name).toBe('Updated');
    expect(decrypt(updatedInstructor.phone)).toBe('9999999999');

    const instructors = await userService.getInstructorsByTenant(testSchool.id);
    expect(instructors.length).toBeGreaterThanOrEqual(1);
    expect(instructors.some((instructor: any) => instructor.id === instructor2.id)).toBe(true);
  });
});
