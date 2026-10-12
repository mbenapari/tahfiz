import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { School, User } from '../model';
import { UserRole } from '../model/User';
import * as profileController from '../controller/profileController';
import * as sessionController from '../controller/sessionController';
import * as userService from '../services/userService';
import * as enrollmentService from '../services/enrollmentService';

const mockRes = () => {
  const res: any = { statusCode: 200, body: undefined };
  res.status = (code: number) => { res.statusCode = code; return res; };
  res.json = (body: any) => { res.body = body; return res; };
  return res;
};

describe('Progress onboarding & session instructor attribution', () => {
  let school: any;
  let instructor: any;
  let student: any;

  beforeAll(async () => {
    const ts = Date.now();
    school = await School.create({
      name: `Onboarding Test School ${ts}`,
      slug: `onboarding-test-${ts}`,
      timezone: 'UTC',
      study_days: [0, 1, 2, 3, 4, 5, 6],
    });
    instructor = await User.create({
      tenant_id: school.id,
      first_name: 'Onb',
      last_name: 'Instructor',
      email: `onb_inst_${ts}@test.com`,
      password: 'hashed_not_used',
      role: UserRole.INSTRUCTOR,
    });
    student = await User.create({
      tenant_id: school.id,
      first_name: 'Onb',
      last_name: 'Student',
      email: `onb_student_${ts}@test.com`,
      password: 'hashed_not_used',
      role: UserRole.STUDENT,
    });
    await enrollmentService.createEnrollment({ tenant_id: school.id, student_id: student.id } as any);
  });

  afterAll(async () => {
    await student?.destroy({ force: true });
    await instructor?.destroy({ force: true });
    await school?.destroy({ force: true });
  });

  describe('dismissProgressOnboarding', () => {
    it('defaults to not dismissed', async () => {
      const fresh = await User.findByPk(instructor.id);
      expect(fresh!.progress_onboarding_dismissed).toBe(false);
    });

    it('returns 401 without an authenticated user', async () => {
      const res = mockRes();
      await profileController.dismissProgressOnboarding({ correlationId: 't' } as any, res);
      expect(res.statusCode).toBe(401);
    });

    it('persists the dismissal on the user record', async () => {
      const res = mockRes();
      await profileController.dismissProgressOnboarding(
        { correlationId: 't', user: { userId: instructor.id } } as any,
        res
      );
      expect(res.statusCode).toBe(200);
      const fresh = await User.findByPk(instructor.id);
      expect(fresh!.progress_onboarding_dismissed).toBe(true);
    });
  });

  describe('saveDailySession instructor attribution', () => {
    it('rejects requests without a user id', async () => {
      const res = mockRes();
      await sessionController.saveDailySession(
        { correlationId: 't', body: {}, user: {} } as any,
        res
      );
      expect(res.statusCode).toBe(401);
    });

    it('records the authenticated instructor so has-activity becomes true', async () => {
      const req: any = { correlationId: 't', user: { userId: instructor.id, tenantId: school.id } };

      const before = mockRes();
      await sessionController.getInstructorHasActivity(req, before);
      expect(before.body.hasActivity).toBe(false);

      const save = mockRes();
      await sessionController.saveDailySession(
        {
          ...req,
          body: {
            studentId: student.id,
            sessionDate: '2026-10-09',
            recordingDate: '2026-10-09',
            attendance: { status: 'present' },
          },
        } as any,
        save
      );
      expect(save.statusCode).toBeLessThan(300);

      const after = mockRes();
      await sessionController.getInstructorHasActivity(req, after);
      expect(after.body.hasActivity).toBe(true);
    });
  });

  describe('student payloads', () => {
    it('never include password or email_blind_index', async () => {
      const result: any = await userService.getStudentsWithProgress(school.id, 1, 10);
      expect(result.students.length).toBeGreaterThan(0);
      for (const s of result.students) {
        expect(s).not.toHaveProperty('password');
        expect(s).not.toHaveProperty('email_blind_index');
      }
    });
  });
});
