import { Request, Response } from 'express';
import * as revisionPerformanceService from '../services/revisionPerformanceService';
import * as revisionService from '../services/revisionService';
import * as instructorNoteService from '../services/instructorNoteService';
import { NoteTargetType, NoteVisibility } from '../model/InstructorNote';
import logger from '../utils/logger';
import { getTenantId } from '../utils/schoolContext';

/**
 * Update the performance rating for a revision record.
 * PUT /api/revision/:revisionRecordId/rating
 */
export const updateRevisionRating = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { revisionRecordId } = req.params;
  const { rating } = req.body;

  if (rating === undefined || rating === null) {
    return res.status(400).json({ error: 'Rating is required' });
  }

  try {
    const tenantId = getTenantId(req);
    logger.info(`revisionController: updateRevisionRating - Updating rating for revisionRecordId: ${revisionRecordId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId,
      rating
    });
    const result = await revisionPerformanceService.updateRevisionRating(
      Number(revisionRecordId),
      tenantId,
      { rating: Number(rating) },
      logId
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`revisionController: updateRevisionRating - Error: ${error.message}`, { logId });
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
  const logId = req.correlationId || 'unknown';
  const { revisionRecordId } = req.params;

  try {
    const tenantId = getTenantId(req);
    logger.info(`revisionController: getRevisionRating - Fetching rating for revisionRecordId: ${revisionRecordId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const result = await revisionPerformanceService.getRevisionRating(
      Number(revisionRecordId),
      tenantId,
      logId
    );

    res.json({ success: true, data: result });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`revisionController: getRevisionRating - Error: ${error.message}`, { logId });
    res.status(404).json({ error: error.message });
  }
};

/**
 * Get aggregate performance statistics for a student's revision sessions.
 * GET /api/revision/stats/:studentId
 */
export const getStudentRevisionStats = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { studentId } = req.params;

  try {
    const tenantId = getTenantId(req);
    logger.info(`revisionController: getStudentRevisionStats - Fetching stats for studentId: ${studentId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const stats = await revisionPerformanceService.getStudentRevisionStats(
      Number(studentId),
      tenantId,
      logId
    );

    res.json({ success: true, data: stats });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`revisionController: getStudentRevisionStats - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to fetch revision statistics' });
  }
};

/**
 * Get instructor notes for a revision record.
 * GET /api/revision/:revisionRecordId/notes
 * Query: ?visibility=public|private|all (default: public)
 */
export const getRevisionNotes = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const instructorId = (req.user as any)?.id;
  const { revisionRecordId } = req.params;

  try {
    const tenantId = getTenantId(req);
    logger.info(`revisionController: getRevisionNotes - Fetching notes for revisionRecordId: ${revisionRecordId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    // Verify revision record exists and belongs to tenant
    await revisionService.getRevisionRecordById(Number(revisionRecordId), tenantId);

    const notes = await instructorNoteService.getNotesByTarget(
      tenantId,
      NoteTargetType.REVISION,
      Number(revisionRecordId),
      instructorId,
      logId
    );

    res.json({ success: true, data: notes });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`revisionController: getRevisionNotes - Error: ${error.message}`, { logId });
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
  const logId = req.correlationId || 'unknown';
  const instructorId = (req.user as any)?.id;
  const { revisionRecordId } = req.params;
  const { content, visibility, annotationRef } = req.body;

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: 'Note content is required' });
  }

  // Validate visibility
  if (visibility && !['public', 'private'].includes(visibility)) {
    return res.status(400).json({ error: 'Visibility must be "public" or "private"' });
  }

  try {
    const tenantId = getTenantId(req);
    logger.info(`revisionController: createRevisionNote - Creating note for revisionRecordId: ${revisionRecordId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
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
    }, logId);

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
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`revisionController: createRevisionNote - Error: ${error.message}`, { logId });
    res.status(500).json({ error: error.message || 'Failed to create note' });
  }
};

/**
 * Update an existing instructor note.
 * PUT /api/revision/notes/:noteId
 */
export const updateRevisionNote = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const instructorId = (req.user as any)?.id;
  const { noteId } = req.params;
  const { content, visibility } = req.body;

  try {
    const tenantId = getTenantId(req);
    logger.info(`revisionController: updateRevisionNote - Updating noteId: ${noteId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    await instructorNoteService.updateInstructorNote(
      Number(noteId),
      instructorId!,
      tenantId,
      { content, visibility },
      logId
    );

    res.json({ success: true, message: 'Note updated successfully' });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`revisionController: updateRevisionNote - Error: ${error.message}`, { logId });
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
  const logId = req.correlationId || 'unknown';
  const instructorId = (req.user as any)?.id;
  const { noteId } = req.params;

  try {
    const tenantId = getTenantId(req);
    logger.info(`revisionController: deleteRevisionNote - Deleting noteId: ${noteId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    await instructorNoteService.deleteInstructorNote(
      Number(noteId),
      instructorId!,
      tenantId,
      false,
      logId
    );

    res.json({ success: true, message: 'Note deleted successfully' });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`revisionController: deleteRevisionNote - Error: ${error.message}`, { logId });
    const status = error.message.includes('not found') ? 404 :
      error.message.includes('own notes') ? 403 : 500;
    res.status(status).json({ error: error.message });
  }
};
