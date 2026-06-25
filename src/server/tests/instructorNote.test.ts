import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { School, User, InstructorNote, NoteVisibility, NoteTargetType } from '../model';
import { UserRole } from '../model/User';
import * as instructorNoteService from '../services/instructorNoteService';
import { decrypt } from '../utils/crypto';

describe('Instructor Note Service', () => {
  let testSchool: any;
  let testInstructor: any;
  let testStudent: any;
  let testNote: any;

  beforeAll(async () => {
    // Create test school
    testSchool = await School.create({
      name: `Note Test School ${Date.now()}`,
      slug: `note-test-${Date.now()}`,
      timezone: 'UTC',
      study_days: [1, 2, 3, 4, 5],
    });

    // Create test instructor
    testInstructor = await User.create({
      tenant_id: testSchool.id,
      first_name: 'Note',
      last_name: 'Instructor',
      email: `note_inst_${Date.now()}@test.com`,
      password: 'hashed_not_used',
      role: UserRole.INSTRUCTOR,
    });

    // Create test student
    testStudent = await User.create({
      tenant_id: testSchool.id,
      first_name: 'Note',
      last_name: 'Student',
      email: `note_student_${Date.now()}@test.com`,
      password: 'hashed_not_used',
      role: UserRole.STUDENT,
    });
  });

  afterAll(async () => {
    if (testNote?.destroy) await testNote.destroy({ force: true });
    if (testStudent?.destroy) await testStudent.destroy({ force: true });
    if (testInstructor?.destroy) await testInstructor.destroy({ force: true });
    if (testSchool?.destroy) await testSchool.destroy({ force: true });
  });

  describe('Create Note', () => {
    it('should create a note with encrypted content', async () => {
      const rawContent = 'Test note content with <b>rich text</b>';
      testNote = await instructorNoteService.createInstructorNote({
        tenant_id: testSchool.id,
        target_type: NoteTargetType.REVISION,
        target_id: 100,
        instructor_id: testInstructor.id,
        student_id: testStudent.id,
        content: rawContent,
        visibility: NoteVisibility.PRIVATE,
      });

      expect(testNote.id).toBeDefined();
      expect(testNote.content).not.toBe(rawContent); // Should be encrypted
      expect(decrypt(testNote.content)).toBe(rawContent);
    });

    it('should sanitize content to prevent XSS', async () => {
      const maliciousContent = 'Hello <script>alert("xss")</script><img src=x onerror=alert(1)>';
      const sanitizedNote = await instructorNoteService.createInstructorNote({
        tenant_id: testSchool.id,
        target_type: NoteTargetType.REVISION,
        target_id: 101,
        instructor_id: testInstructor.id,
        student_id: testStudent.id,
        content: maliciousContent,
      });

      const decrypted = decrypt(sanitizedNote.content);
      expect(decrypted).not.toContain('<script>');
      expect(decrypted).not.toContain('onerror');
      await sanitizedNote.destroy({ force: true });
    });
  });

  describe('Get Notes', () => {
    it('should return private notes to the author', async () => {
      const notes = await instructorNoteService.getNotesByTarget(
        testSchool.id,
        NoteTargetType.REVISION,
        100,
        testInstructor.id
      );

      expect(notes.length).toBeGreaterThanOrEqual(1);
      expect(notes[0].content).toBe('Test note content with <b>rich text</b>');
    });

    it('should NOT return private notes to other users', async () => {
      const notes = await instructorNoteService.getNotesByTarget(
        testSchool.id,
        NoteTargetType.REVISION,
        100,
        99999 // Different user
      );

      expect(notes.length).toBe(0);
    });

    it('should return public notes to everyone', async () => {
      const publicNote = await instructorNoteService.createInstructorNote({
        tenant_id: testSchool.id,
        target_type: NoteTargetType.REVISION,
        target_id: 200,
        instructor_id: testInstructor.id,
        student_id: testStudent.id,
        content: 'Public content',
        visibility: NoteVisibility.PUBLIC,
      });

      const notes = await instructorNoteService.getNotesByTarget(
        testSchool.id,
        NoteTargetType.REVISION,
        200,
        99999
      );

      expect(notes.length).toBe(1);
      expect(notes[0].content).toBe('Public content');
      await publicNote.destroy({ force: true });
    });
  });

  describe('Update Note', () => {
    it('should allow author to update note content', async () => {
      await instructorNoteService.updateInstructorNote(
        testNote.id,
        testInstructor.id,
        testSchool.id,
        { content: 'Updated content' }
      );

      const updated = await InstructorNote.findByPk(testNote.id);
      expect(decrypt(updated!.content)).toBe('Updated content');
    });

    it('should reject updates from non-authors', async () => {
      await expect(
        instructorNoteService.updateInstructorNote(
          testNote.id,
          99999,
          testSchool.id,
          { content: 'Hack' }
        )
      ).rejects.toThrow('You can only edit your own notes');
    });
  });

  describe('Delete Note', () => {
    it('should allow author to delete note', async () => {
      const toDelete = await instructorNoteService.createInstructorNote({
        tenant_id: testSchool.id,
        target_type: NoteTargetType.REVISION,
        target_id: 300,
        instructor_id: testInstructor.id,
        student_id: testStudent.id,
        content: 'Delete me',
      });

      await instructorNoteService.deleteInstructorNote(
        toDelete.id,
        testInstructor.id,
        testSchool.id
      );

      const found = await InstructorNote.findByPk(toDelete.id);
      expect(found).toBeNull();
    });

    it('should reject deletion from non-authors', async () => {
      await expect(
        instructorNoteService.deleteInstructorNote(
          testNote.id,
          99999,
          testSchool.id
        )
      ).rejects.toThrow('You can only delete your own notes');
    });
  });
});
