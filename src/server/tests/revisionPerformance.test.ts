import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { School, User } from '../model';
import { UserRole } from '../model/User';
import RevisionRecord from '../model/RevisionRecord';
import Session from '../model/Session';
import * as revisionPerformanceService from '../services/revisionPerformanceService';
import * as revisionService from '../services/revisionService';
import { RevisionRating, REVISION_RATING_LABELS } from '../model/RevisionRecord';

describe('Revision Performance Service', () => {
  let testSchool: any;
  let testStudent: any;
  let testSession: any;
  let testRevisionRecord: any;

  beforeAll(async () => {
    // Create test school
    testSchool = await School.create({
      name: `Rev Perf Test School ${Date.now()}`,
      slug: `rev-perf-test-${Date.now()}`,
      timezone: 'UTC',
      study_days: [1, 2, 3, 4, 5],
    });

    // Create test student
    testStudent = await User.create({
      tenant_id: testSchool.id,
      first_name: 'RevPerf',
      last_name: 'Student',
      email: `revperf_student_${Date.now()}@test.com`,
      password: 'hashed_not_used',
      role: UserRole.STUDENT,
    });

    // Create test session
    testSession = await Session.create({
      tenant_id: testSchool.id,
      student_id: testStudent.id,
      session_date: new Date().toISOString().split('T')[0],
    });

    // Create test revision record with page-based revision
    testRevisionRecord = await revisionService.createRevisionRecord({
      tenant_id: testSchool.id,
      session_id: testSession.id,
      student_id: testStudent.id,
      start_page: 1,
      end_page: 5,
      is_full_surah: false,
    });
  });

  afterAll(async () => {
    if (testRevisionRecord?.destroy) await testRevisionRecord.destroy({ force: true });
    if (testSession?.destroy) await testSession.destroy({ force: true });
    if (testStudent?.destroy) await testStudent.destroy({ force: true });
    if (testSchool?.destroy) await testSchool.destroy({ force: true });
  });

  // Unit: Rating validation
  describe('Rating Validation', () => {
    it('should accept valid rating of 3', async () => {
      const result = await revisionPerformanceService.updateRevisionRating(
        testRevisionRecord.id,
        testSchool.id,
        { rating: 3 },
      );
      expect(result.rating).toBe(3);
      expect(result.label).toBe(REVISION_RATING_LABELS[RevisionRating.AVERAGE]);
    });

    it('should accept valid rating of 5 (excellent)', async () => {
      const result = await revisionPerformanceService.updateRevisionRating(
        testRevisionRecord.id,
        testSchool.id,
        { rating: 5 },
      );
      expect(result.rating).toBe(5);
    });

    it('should accept valid rating of 1 (very poor)', async () => {
      const result = await revisionPerformanceService.updateRevisionRating(
        testRevisionRecord.id,
        testSchool.id,
        { rating: 1 },
      );
      expect(result.rating).toBe(1);
    });

    it('should reject rating below 1', async () => {
      await expect(
        revisionPerformanceService.updateRevisionRating(
          testRevisionRecord.id,
          testSchool.id,
          { rating: 0 },
        )
      ).rejects.toThrow('Rating must be an integer between 1 and 5');
    });

    it('should reject rating above 5', async () => {
      await expect(
        revisionPerformanceService.updateRevisionRating(
          testRevisionRecord.id,
          testSchool.id,
          { rating: 6 },
        )
      ).rejects.toThrow('Rating must be an integer between 1 and 5');
    });

    it('should reject non-integer rating', async () => {
      await expect(
        revisionPerformanceService.updateRevisionRating(
          testRevisionRecord.id,
          testSchool.id,
          { rating: 3.5 },
        )
      ).rejects.toThrow('Rating must be an integer between 1 and 5');
    });

    it('should reject rating for non-existent revision record', async () => {
      await expect(
        revisionPerformanceService.updateRevisionRating(
          99999,
          testSchool.id,
          { rating: 3 },
        )
      ).rejects.toThrow('Revision record not found');
    });

    it('should reject rating for wrong tenant', async () => {
      await expect(
        revisionPerformanceService.updateRevisionRating(
          testRevisionRecord.id,
          99999,
          { rating: 3 },
        )
      ).rejects.toThrow('Revision record not found');
    });
  });

  // Integration: Rating persistence
  describe('Rating Persistence', () => {
    it('should persist rating in the database', async () => {
      await revisionPerformanceService.updateRevisionRating(
        testRevisionRecord.id,
        testSchool.id,
        { rating: 4 },
      );

      const fetched = await revisionPerformanceService.getRevisionRating(
        testRevisionRecord.id,
        testSchool.id,
      );
      expect(fetched.rating).toBe(4);
      expect(fetched.label).toBe(REVISION_RATING_LABELS[RevisionRating.GOOD]);
    });

    it('should handle not-rated records gracefully', async () => {
      // Persist an explicit null rating because the model default is 3.
      const unrated = await RevisionRecord.create({
        tenant_id: testSchool.id,
        session_id: testSession.id,
        student_id: testStudent.id,
        start_page: 10,
        end_page: 15,
        rating: null as unknown as number,
      });

      const result = await revisionPerformanceService.getRevisionRating(
        unrated.id,
        testSchool.id,
      );
      expect(result.rating).toBeNull();
      expect(result.label).toBe('Not Rated');

      await unrated.destroy({ force: true });
    });
  });

  // Unit: Student stats
  describe('Student Revision Stats', () => {
    it('should calculate average rating and distribution correctly', async () => {
      // First ensure the test record has a rating
      await revisionPerformanceService.updateRevisionRating(
        testRevisionRecord.id,
        testSchool.id,
        { rating: 3 },
      );

      const stats = await revisionPerformanceService.getStudentRevisionStats(
        testStudent.id,
        testSchool.id,
      );

      expect(stats.totalRevisionSessions).toBeGreaterThanOrEqual(1);
      expect(stats.ratedSessions).toBeGreaterThanOrEqual(1);
      expect(stats.averageRating).toBeGreaterThan(0);
      expect(stats.ratingDistribution).toBeDefined();
      expect((stats.ratingDistribution as any)[3]).toBeGreaterThanOrEqual(1);
    });
  });
});
