import { Role } from '../model';
import * as userService from '../services/userService';
import { UserRole } from '../model/User';

describe('User Role Assignment', () => {
  const testEmail = `role_test_${Date.now()}@example.com`;
  let createdUser: any = null;

  beforeAll(async () => {
    // Ensure 'student' role exists
    await Role.findOrCreate({
      where: { slug: 'student' },
      defaults: { name: 'Student', slug: 'student', description: 'Student' }
    });
  });

  afterAll(async () => {
    if (createdUser && createdUser.destroy) {
      await createdUser.destroy({ force: true });
    }
  });

  test('creates user and assigns role_id based on role slug', async () => {
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
    createdUser = newUser;

    expect(newUser.role_id).toBeDefined();

    const studentRole = await Role.findOne({ where: { slug: 'student' } });
    expect(studentRole).not.toBeNull();
    expect(newUser.role_id).toBe(studentRole!.id);
  });
});
