import { Request, Response } from 'express';
import * as revisionPerformanceService from '../services/revisionPerformanceService';
import * as revisionService from '../services/revisionService';
import * as instructorNoteService from '../services/instructorNoteService';
import { NoteTargetType, NoteVisibility } from '../model/InstructorNote';
import logger from '../utils/logger';

/**
 * Update the performance rating for a revision record.
 * PUT /api/revision/:revisionRecordId/rating
 */
export const updateRevisionRating = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const { revisionRecordId } = req.params;
  const { rating } = req.body;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (rating === undefined || rating === null) {
    return res.status(400).json({ error: 'Rating is required' });
  }

  try {
    const result = await revisionPerformanceService.updateRevisionRating(
      Number(revisionRecordId),
      tenantId,
      { rating: Number(rating) },
      correlationId
    );

    logger.info('Revision rating updated via API', {
      correlationId,
      revisionRecordId: Number(revisionRecordId),
      rating,
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('revisionController.updateRevisionRating: Error', {
      correlationId,
      error: error.message,
      stack: error.stack,
      revisionRecordId,
    });
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message || 'Failed to update revision rating',
    });
  }
};

/**
 * Get the performance rating for a revision record.
 * GET /api/revision/:revisionRecordId/rating
 */
export const getRevisionRating = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const { revisionRecordId } = req.params;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await revisionPerformanceService.getRevisionRating(
      Number(revisionRecordId),
      tenantId,
      correlationId
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    logger.error('revisionController.getRevisionRating: Error', {
      correlationId,
      error: error.message,
      revisionRecordId,
    });
    res.status(404).json({ error: error.message });
  }
};

/**
 * Get aggregate performance statistics for a student's revision sessions.
 * GET /api/revision/stats/:studentId
 */
export const getStudentRevisionStats = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const { studentId } = req.params;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const stats = await revisionPerformanceService.getStudentRevisionStats(
      Number(studentId),
      tenantId,
      correlationId
    );

    logger.info('Revision stats retrieved', {
      correlationId,
      studentId,
      averageRating: stats.averageRating,
    });

    res.json({ success: true, data: stats });
  } catch (error: any) {
    logger.error('revisionController.getStudentRevisionStats: Error', {
      correlationId,
      error: error.message,
      studentId,
    });
    res.status(500).json({ error: 'Failed to fetch revision statistics' });
  }
};

/**
 * Get instructor notes for a revision record.
 * GET /api/revision/:revisionRecordId/notes
 * Query: ?visibility=public|private|all (default: public)
 */
export const getRevisionNotes = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const instructorId = (req.user as any)?.id;
  const { revisionRecordId } = req.params;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Verify revision record exists and belongs to tenant
    await revisionService.getRevisionRecordById(Number(revisionRecordId), tenantId);

    const notes = await instructorNoteService.getNotesByTarget(
      tenantId,
      NoteTargetType.REVISION,
      Number(revisionRecordId),
      instructorId,
      correlationId
    );

    logger.info('Revision notes fetched', {
      correlationId,
      revisionRecordId,
      noteCount: notes.length,
      requesterId: instructorId,
    });

    res.json({ success: true, data: notes });
  } catch (error: any) {
    logger.error('revisionController.getRevisionNotes: Error', {
      correlationId,
      error: error.message,
      revisionRecordId,
    });
    res.status(error.message.includes('not found') ? 404 : 500).json({
      error: error.message || 'Failed to fetch revision notes',
    });
  }
};

/**
 * Create a new instructor note for a revision record.
 * POST /api/revision/:revisionRecordId/notes
 */
export const createRevisionNote = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const instructorId = (req.user as any)?.id;
  const { revisionRecordId } = req.params;
  const { content, visibility, annotationRef } = req.body;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  // Validate visibility
  if (visibility && !['public', 'private'].includes(visibility)) {
    return res.status(400).json({ error: 'Visibility must be "public" or "private"' });
  }

  try {
    // Verify revision record exists and belongs to tenant
    const revRecord = await revisionService.getRevisionRecordById(Number(revisionRecordId), tenantId);

    const note = await instructorNoteService.createInstructorNote({
      tenant_id: tenantId,
      target_type: NoteTargetType.REVISION,
      target_id: Number(revisionRecordId),
      instructor_id: instructorId!,
      student_id: revRecord.student_id,
      content,
      visibility: visibility === 'public' ? NoteVisibility.PUBLIC : NoteVisibility.PRIVATE,
      annotation_ref: annotationRef || null,
    }, correlationId);

    logger.info('Instructor note created via API', {
      correlationId,
      noteId: note.id,
      revisionRecordId,
      instructorId,
      visibility: note.visibility,
    });

    res.status(201).json({
      success: true,
      data: {
        id: note.id,
        visibility: note.visibility,
        annotationRef: note.annotation_ref,
        createdAt: note.created_at,
      },
    });
  } catch (error: any) {
    logger.error('revisionController.createRevisionNote: Error', {
      correlationId,
      error: error.message,
      revisionRecordId,
    });
    res.status(500).json({ error: error.message || 'Failed to create note' });
  }
};

/**
 * Update an existing instructor note.
 * PUT /api/revision/notes/:noteId
 */
export const updateRevisionNote = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const instructorId = (req.user as any)?.id;
  const { noteId } = req.params;
  const { content, visibility } = req.body;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await instructorNoteService.updateInstructorNote(
      Number(noteId),
      instructorId!,
      tenantId,
      { content, visibility },
      correlationId
    );

    logger.info('Instructor note updated via API', {
      correlationId,
      noteId,
      instructorId,
    });

    res.json({ success: true, message: 'Note updated successfully' });
  } catch (error: any) {
    logger.error('revisionController.updateRevisionNote: Error', {
      correlationId,
      error: error.message,
      noteId,
    });
    const status = error.message.includes('not found') ? 404 :
      error.message.includes('own notes') ? 403 : 500;
    res.status(status).json({ error: error.message });
  }
};

/**
 * Delete an instructor note.
 * DELETE /api/revision/notes/:noteId
 */
export const deleteRevisionNote = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const instructorId = (req.user as any)?.id;
  const { noteId } = req.params;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    await instructorNoteService.deleteInstructorNote(
      Number(noteId),
      instructorId!,
      tenantId,
      false,
      correlationId
    );

    logger.info('Instructor note deleted via API', {
      correlationId,
      noteId,
      instructorId,
    });

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error: any) {
    logger.error('revisionController.deleteRevisionNote: Error', {
      correlationId,
      error: error.message,
      noteId,
    });
    const status = error.message.includes('not found') ? 404 :
      error.message.includes('own notes') ? 403 : 500;
    res.status(status).json({ error: error.message });
  }
};
