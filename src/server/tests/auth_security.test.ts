import { describe, it, expect, afterAll } from '@jest/globals';
import User, { UserRole } from '../model/User';
import * as userService from '../services/userService';

describe('Authentication Security Tests', () => {
  const testEmail = `test_security_${Date.now()}@example.com`;
  const plainPassword = 'StrongPassword123!';
  let userId: number | null = null;
  let fetchedUser: any = null;

  afterAll(async () => {
    if (fetchedUser?.destroy) {
      await fetchedUser.destroy({ force: true });
    }
  });

  it('should hash user passwords on creation and verify them correctly', async () => {
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

    expect(newUser.password).toBeDefined();
    expect(newUser.password).not.toBe(plainPassword);
    expect(newUser.password.startsWith('$2b$12$')).toBe(true);

    fetchedUser = await User.findByPk(userId);
    expect(fetchedUser).not.toBeNull();

    const isValid = await fetchedUser.validatePassword(plainPassword);
    expect(isValid).toBe(true);

    const isInvalid = await fetchedUser.validatePassword('WrongPassword');
    expect(isInvalid).toBe(false);

    const start = Date.now();
    await fetchedUser.validatePassword(plainPassword);
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(500);
  });
});
