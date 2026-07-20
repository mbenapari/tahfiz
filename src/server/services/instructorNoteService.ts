import { InstructorNote, NoteVisibility, NoteTargetType } from '../model';
import logger from '../utils/logger';
import { encrypt, decrypt } from '../utils/crypto';

/** DTO for creating an instructor note with encrypted content */
export interface CreateInstructorNoteDTO {
  tenant_id: number;
  target_type: NoteTargetType;
  target_id: number;
  instructor_id: number;
  student_id: number;
  content: string;
  visibility?: NoteVisibility;
  annotation_ref?: string | null;
}

/** DTO for updating an instructor note */
export interface UpdateInstructorNoteDTO {
  content?: string;
  visibility?: NoteVisibility;
  annotation_ref?: string | null;
}

/** Sanitize HTML content to prevent XSS — strip script tags and event handlers */
const sanitizeContent = (content: string): string => {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/\bon\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\bon\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\bon\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '');
};

/**
 * Create an instructor note with encrypted content for secure storage.
 * Content is sanitized then encrypted before persistence.
 */
export const createInstructorNote = async (data: CreateInstructorNoteDTO, correlationId?: string) => {
  const logId = correlationId || 'unknown';
  try {
    // Validate content length
    if (!data.content || data.content.trim().length === 0) {
      throw new Error('Note content cannot be empty');
    }
    if (data.content.length > 10000) {
      throw new Error('Note content exceeds maximum length of 10,000 characters');
    }

    // Sanitize HTML content to prevent XSS
    const sanitizedContent = sanitizeContent(data.content.trim());

    // Encrypt content for storage
    const encryptedContent = encrypt(sanitizedContent);

    const note = await InstructorNote.create({
      tenant_id: data.tenant_id,
      target_type: data.target_type,
      target_id: data.target_id,
      instructor_id: data.instructor_id,
      student_id: data.student_id,
      content: encryptedContent,
      visibility: data.visibility || NoteVisibility.PRIVATE,
      annotation_ref: data.annotation_ref || null,
    });

    logger.info('Instructor note created', {
      correlationId: logId,
      noteId: note.id,
      instructorId: data.instructor_id,
      studentId: data.student_id,
      targetType: data.target_type,
      targetId: data.target_id,
      visibility: note.visibility,
    });

    return note;
  } catch (error: any) {
    logger.error('Failed to create instructor note', {
      correlationId: logId,
      error: error.message,
      stack: error.stack,
      instructorId: data.instructor_id,
      studentId: data.student_id,
    });
    throw error;
  }
};

/**
 * Fetch instructor notes for a specific target (revision/hifz record) with decrypted content.
 * Access control: private notes are returned only if the requester is the instructor who created them.
 */
export const getNotesByTarget = async (
  tenant_id: number,
  target_type: NoteTargetType,
  target_id: number,
  requesterId?: number,
  correlationId?: string
) => {
  const logId = correlationId || 'unknown';
  try {
    const whereClause: any = {
      tenant_id,
      target_type,
      target_id,
    };

    // If requesterId is provided, show all public notes + private notes authored by requester
    // If no requesterId, show only public notes
    const notes = await InstructorNote.findAll({
      where: whereClause,
      order: [['created_at', 'ASC']],
    });

    // Decrypt content and filter by visibility
    const decryptedNotes = notes
      .map((note) => {
        try {
          return {
            id: note.id,
            instructor_id: note.instructor_id,
            student_id: note.student_id,
            content: decrypt(note.content),
            visibility: note.visibility,
            annotation_ref: note.annotation_ref,
            created_at: note.created_at,
            updated_at: note.updated_at,
          };
        } catch {
          // Skip notes that fail decryption (data corruption)
          logger.warn('Failed to decrypt instructor note content', {
            correlationId: logId,
            noteId: note.id,
          });
          return null;
        }
      })
      .filter(Boolean)
      .filter((note) => {
        if (!requesterId) return note!.visibility === NoteVisibility.PUBLIC;
        if (note!.visibility === NoteVisibility.PUBLIC) return true;
        return note!.instructor_id === requesterId;
      });

    logger.info('Instructor notes fetched', {
      correlationId: logId,
      targetType: target_type,
      targetId: target_id,
      count: decryptedNotes.length,
    });

    return decryptedNotes;
  } catch (error: any) {
    logger.error('Failed to fetch instructor notes', {
      correlationId: logId,
      error: error.message,
      stack: error.stack,
      targetType: target_type,
      targetId: target_id,
    });
    throw error;
  }
};

/**
 * Update an existing instructor note with proper authorization.
 * Only the original instructor author can update their notes.
 */
export const updateInstructorNote = async (
  id: number,
  instructor_id: number,
  tenant_id: number,
  data: UpdateInstructorNoteDTO,
  correlationId?: string
) => {
  const logId = correlationId || 'unknown';
  try {
    const note = await InstructorNote.findOne({
      where: { id, tenant_id },
    });

    if (!note) {
      throw new Error('Instructor note not found');
    }

    // Authorization: only the note author can update
    if (note.instructor_id !== instructor_id) {
      logger.warn('Unauthorized note update attempt', {
        correlationId: logId,
        noteId: id,
        requestorId: instructor_id,
        authorId: note.instructor_id,
      });
      throw new Error('You can only edit your own notes');
    }

    const updateData: any = {};
    if (data.content !== undefined) {
      const sanitized = sanitizeContent(data.content.trim());
      updateData.content = encrypt(sanitized);
    }
    if (data.visibility !== undefined) {
      updateData.visibility = data.visibility;
    }
    if (data.annotation_ref !== undefined) {
      updateData.annotation_ref = data.annotation_ref;
    }

    await note.update(updateData);

    logger.info('Instructor note updated', {
      correlationId: logId,
      noteId: id,
      instructorId: instructor_id,
    });

    return note;
  } catch (error: any) {
    logger.error('Failed to update instructor note', {
      correlationId: logId,
      error: error.message,
      stack: error.stack,
      noteId: id,
    });
    throw error;
  }
};

/**
 * Delete an instructor note with proper authorization.
 * Only the original instructor author or a tenant admin can delete.
 */
export const deleteInstructorNote = async (
  id: number,
  requester_id: number,
  tenant_id: number,
  isAdmin: boolean = false,
  correlationId?: string
) => {
  const logId = correlationId || 'unknown';
  try {
    const note = await InstructorNote.findOne({
      where: { id, tenant_id },
    });

    if (!note) {
      throw new Error('Instructor note not found');
    }

    // Authorization: only note author or admin can delete
    if (note.instructor_id !== requester_id && !isAdmin) {
      logger.warn('Unauthorized note deletion attempt', {
        correlationId: logId,
        noteId: id,
        requestorId: requester_id,
        authorId: note.instructor_id,
      });
      throw new Error('You can only delete your own notes');
    }

    await note.destroy();

    logger.info('Instructor note deleted', {
      correlationId: logId,
      noteId: id,
      instructorId: requester_id,
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to delete instructor note', {
      correlationId: logId,
      error: error.message,
      stack: error.stack,
      noteId: id,
    });
    throw error;
  }
};
