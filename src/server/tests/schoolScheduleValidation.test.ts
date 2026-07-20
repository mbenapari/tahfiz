import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import School from '../model/School';
import { SCHEDULE_OVERLAP_ERROR_CODE } from '../constants';

const mockGetSchoolById = jest.fn();
const mockUpdateSchool = jest.fn();
const mockCreateSchool = jest.fn();

await jest.unstable_mockModule('../services/schoolService', () => ({
  getSchoolById: mockGetSchoolById,
  updateSchool: mockUpdateSchool,
  createSchool: mockCreateSchool,
}));

const schoolController = await import('../controller/schoolController');
const ownerManagementController = await import('../controller/ownerManagementController');

const createMockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('school schedule validation controllers', () => {
  const currentSchool = {
    id: 1,
    name: 'Test School',
    slug: 'test-school',
    timezone: 'UTC',
    study_days: [1, 2, 3, 4, 5],
    schedule_mode: 'simple',
    session_type_day_map: null,
    get: function () {
      return this;
    },
  } as unknown as School;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects overlapping advanced config on school update with 400', async () => {
    (mockGetSchoolById as any).mockResolvedValue(currentSchool);
    (mockUpdateSchool as any).mockResolvedValue(currentSchool);

    const req: any = {
      correlationId: 'test-log',
      user: { tenantId: 1 },
      body: {
        scheduleMode: 'advanced',
        studyDays: ['MON', 'TUE', 'WED'],
        sessionTypeDayMap: {
          'memorization:default': [1, 2],
          revision: [2, 4],
        },
      },
    };
    const res = createMockRes();

    await schoolController.updateSchool(req, res);

    expect(mockUpdateSchool).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: SCHEDULE_OVERLAP_ERROR_CODE,
      })
    );
  });

  it('allows valid non-overlapping advanced config on school update', async () => {
    const updatedSchool = {
      ...currentSchool,
      schedule_mode: 'advanced',
      session_type_day_map: {
        'memorization:default': [1, 3, 5],
        revision: [2, 4],
      },
    } as unknown as School;

    (mockGetSchoolById as any).mockResolvedValue(currentSchool);
    (mockUpdateSchool as any).mockResolvedValue(updatedSchool);

    const req: any = {
      correlationId: 'test-log',
      user: { tenantId: 1 },
      body: {
        scheduleMode: 'advanced',
        studyDays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        sessionTypeDayMap: {
          'memorization:default': [1, 3, 5],
          revision: [2, 4],
        },
      },
    };
    const res = createMockRes();

    await schoolController.updateSchool(req, res);

    expect(mockUpdateSchool).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'School updated successfully',
      })
    );
  });

  it('rejects overlapping advanced config on school creation', async () => {
    (mockCreateSchool as any).mockResolvedValue(currentSchool);

    const req: any = {
      correlationId: 'test-log',
      user: { userId: 1 },
      body: {
        schoolName: 'New School',
        slug: 'new-school',
        timezone: 'UTC',
        studyDays: ['MON', 'TUE', 'WED'],
        scheduleMode: 'advanced',
        sessionTypeDayMap: {
          'memorization:default': [1, 2],
          revision: [2, 4],
        },
      },
    };
    const res = createMockRes();

    await schoolController.createSchool(req, res);

    expect(mockCreateSchool).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('allows simple mode updates without overlap checks', async () => {
    (mockGetSchoolById as any).mockResolvedValue(currentSchool);
    (mockUpdateSchool as any).mockResolvedValue(currentSchool);

    const req: any = {
      correlationId: 'test-log',
      user: { tenantId: 1 },
      body: {
        studyDays: ['MON', 'TUE', 'WED'],
        scheduleMode: 'simple',
      },
    };
    const res = createMockRes();

    await schoolController.updateSchool(req, res);

    expect(mockUpdateSchool).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'School updated successfully' }));
  });

  it('returns 400 for overlapping owner-management school updates', async () => {
    const error: any = new Error('Memorization and Revision days cannot overlap in advanced scheduling mode.');
    error.code = SCHEDULE_OVERLAP_ERROR_CODE;
    error.details = { overlappingDays: [2] };
    (mockUpdateSchool as any).mockRejectedValue(error);

    const req: any = {
      params: { id: '7' },
      body: {
        name: 'Owner School',
        slug: 'owner-school',
        timezone: 'UTC',
        studyDays: ['MON', 'TUE', 'WED'],
        scheduleMode: 'advanced',
        sessionTypeDayMap: {
          'memorization:default': [1, 2],
          revision: [2, 4],
        },
      },
    };
    const res = createMockRes();

    await ownerManagementController.updateSchool(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        code: SCHEDULE_OVERLAP_ERROR_CODE,
      })
    );
  });
});
