import { Request, Response } from 'express';
import * as sessionService from '../services/sessionService';
import * as memorizationService from '../services/memorizationService';
import * as revisionService from '../services/revisionService';
import * as surahService from '../services/surahService';
import * as attendanceService from '../services/attendanceService';
import * as progressService from '../services/progressService';
import * as sessionHistoryService from '../services/sessionHistoryService';
import * as instructorNoteService from '../services/instructorNoteService';
import { RecordType } from '../model/MemorizationRecord';
import { NoteTargetType, NoteVisibility } from '../model/InstructorNote';
import logger from '../utils/logger';
import { validateRevisionRecord } from '../utils/revisionValidation';
import { ScheduleService } from '../services/scheduleService';
import * as schoolService from '../services/schoolService';
import { CANONICAL_SESSION_TYPES, MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE } from '../constants';
import { getTenantId } from '../utils/schoolContext';

/**
 * Save a daily session for a student
 * This includes the session metadata and memorization records
 */
export const saveDailySession = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const instructorId = (req.user as any)?.id;
  const { 
    studentId, sessionDate, recordingDate, notes, 
    hifzRecord, revisionRecord, attendance, 
    rating, revisionRating, revisionInstructorNotes 
  } = req.body;

  try {
    const tenantId = getTenantId(req);
    logger.info(`sessionController: saveDailySession - Saving session for studentId: ${studentId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const effectiveDate = recordingDate || sessionDate;

    // Validate revision rating if provided
    if (revisionRating !== undefined && revisionRating !== null) {
      const parsedRating = Number(revisionRating);
      if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ error: 'Revision rating must be an integer between 1 and 5' });
      }
    }

    // 0. Load School for schedule validation
    const school = await schoolService.getSchoolById(tenantId);

    // Validation: Ensure at least one record is provided
    const hasHifz = hifzRecord && hifzRecord.surahNumber;
    const hasRevision =
      revisionRecord &&
      (revisionRecord.surahNumber ||
        (revisionRecord.startSurahNumber && revisionRecord.endSurahNumber) ||
        (revisionRecord.startAyah && revisionRecord.endAyah) ||
        (revisionRecord.startPage && revisionRecord.endPage));
    const hasAttendance = attendance && attendance.status;

    if (!hasHifz && !hasRevision && !hasAttendance) {
      return res.status(400).json({ error: 'Please provide at least a Hifz, Revision, or Attendance record' });
    }

    if (hasAttendance && attendance.status === 'absent' && (hasHifz || hasRevision)) {
      return res.status(400).json({
        error: 'Cannot save lesson records for an absent student.',
        code: 'ABSENT_STUDENT_RECORDING_NOT_ALLOWED',
      });
    }

    const dateValidation = ScheduleService.validateDateFormat(effectiveDate);
    if (!dateValidation.isValid) {
      return res.status(400).json({ error: dateValidation.error, code: dateValidation.code });
    }

    if (hasHifz && hasRevision && school.schedule_mode === 'advanced' && school.session_type_day_map) {
      return res.status(409).json({
        error: 'Hifz and Revision cannot be recorded on the same day in advanced scheduling mode.',
        code: MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE,
        details: {
          sessionType: 'mixed',
          recordingDate: effectiveDate,
          conflictingType: 'mixed',
        },
      });
    }

    // Scheduling Validation
    if (hasHifz) {
      const fullValidation = await ScheduleService.validateFullScheduleCompliance(
        school,
        CANONICAL_SESSION_TYPES.MEMORIZATION_DEFAULT,
        effectiveDate,
        tenantId,
        Number(studentId),
        logId
      );
      if (!fullValidation.isValid) {
        const statusCode = fullValidation.code === MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE ? 409 : 400;
        return res.status(statusCode).json({ error: fullValidation.error, code: fullValidation.code, details: fullValidation.details });
      }
    }

    if (hasRevision) {
      const fullValidation = await ScheduleService.validateFullScheduleCompliance(
        school,
        CANONICAL_SESSION_TYPES.REVISION,
        effectiveDate,
        tenantId,
        Number(studentId),
        logId
      );
      if (!fullValidation.isValid) {
        const statusCode = fullValidation.code === MUTUAL_EXCLUSIVITY_VIOLATION_ERROR_CODE ? 409 : 400;
        return res.status(statusCode).json({ error: fullValidation.error, code: fullValidation.code, details: fullValidation.details });
      }
    }

    // Validation for Hifz record if provided
    if (hasHifz) {
      if (!hifzRecord.startAyah || !hifzRecord.endAyah) {
        return res.status(400).json({ error: 'Hifz record must include start and end ayah' });
      }
      if (Number(hifzRecord.startAyah) > Number(hifzRecord.endAyah)) {
        return res.status(400).json({ error: 'Hifz start ayah cannot be greater than end ayah' });
      }

      // Check against surah ayah count
      const surah = await surahService.getSurahByNumber(Number(hifzRecord.surahNumber));
      if (!surah) {
        return res.status(400).json({ error: `Invalid surah number: ${hifzRecord.surahNumber}` });
      }
      if (Number(hifzRecord.endAyah) > surah.ayah_count) {
        return res.status(400).json({ error: `Hifz end ayah cannot be more than ${surah.ayah_count} (total ayahs in ${surah.name})` });
      }
    }

    // Validation for Revision record if provided
    if (hasRevision) {
      const validationInput = {
        surahNumber: revisionRecord.surahNumber,
        startSurahNumber: revisionRecord.startSurahNumber,
        endSurahNumber: revisionRecord.endSurahNumber,
        startAyah: revisionRecord.startAyah,
        endAyah: revisionRecord.endAyah,
        startPage: revisionRecord.startPage,
        endPage: revisionRecord.endPage,
      };

      const validation = await validateRevisionRecord(
        validationInput,
        async (num) => {
          try {
            return await surahService.getSurahByNumber(num);
          } catch (error) {
            return null;
          }
        }
      );

      if (!validation.isValid) {
        return res.status(400).json({ error: validation.errors[0] });
      }
    }

    // 1. Create the main session record
    const session = await sessionService.createSession({
      tenant_id: tenantId,
      student_id: Number(studentId),
      instructor_id: instructorId,
      session_date: effectiveDate,
      recording_date: recordingDate,
      notes: notes || ''
    });

    // 2. Mark attendance if provided
    if (hasAttendance) {
      await attendanceService.markAttendance(
        session.id,
        attendance.status,
        instructorId
      );
    }

    // 3. Create Hifz record if provided
    let createdMemorizationRecord: any = null;
    if (hifzRecord && hifzRecord.surahNumber) {
      createdMemorizationRecord = await memorizationService.createMemorizationRecord({
        tenant_id: tenantId,
        session_id: session.id,
        student_id: Number(studentId),
        instructor_id: instructorId,
        record_type: RecordType.MEMORIZED,
        surah_number: Number(hifzRecord.surahNumber),
        start_ayah: Number(hifzRecord.startAyah),
        end_ayah: Number(hifzRecord.endAyah),
        is_full_surah: hifzRecord.isFullSurah || false,
        rating: rating ? Number(rating) : undefined,
        notes: hifzRecord.notes || ''
      });

      // Update aggregated progress asynchronously
      progressService.updateAggregatedProgress(Number(studentId), tenantId, Number(hifzRecord.surahNumber))
        .catch(err => logger.error('Error updating aggregated progress:', err));
    }

    // 3. Create Revision record if provided
    let createdRevisionRecord: any = null;
    if (hasRevision) {
      createdRevisionRecord = await revisionService.createRevisionRecord({
        tenant_id: tenantId,
        session_id: session.id,
        student_id: Number(studentId),
        instructor_id: instructorId,
        surah_number: revisionRecord.surahNumber ? Number(revisionRecord.surahNumber) : undefined,
        start_surah_number: revisionRecord.startSurahNumber ? Number(revisionRecord.startSurahNumber) : undefined,
        end_surah_number: revisionRecord.endSurahNumber ? Number(revisionRecord.endSurahNumber) : undefined,
        start_ayah: revisionRecord.startAyah ? Number(revisionRecord.startAyah) : undefined,
        end_ayah: revisionRecord.endAyah ? Number(revisionRecord.endAyah) : undefined,
        start_page: revisionRecord.startPage ? Number(revisionRecord.startPage) : undefined,
        end_page: revisionRecord.endPage ? Number(revisionRecord.endPage) : undefined,
        is_full_surah: revisionRecord.isFullSurah || false,
        rating: revisionRating ? Number(revisionRating) : undefined,
        notes: revisionRecord.notes || ''
      });

      // Structured logging for revision session creation
      logger.info(`sessionController: saveDailySession - Revision record created: ${createdRevisionRecord.id}`, {
        logId,
        revisionRecordId: createdRevisionRecord.id,
        sessionId: session.id,
        studentId: Number(studentId),
        instructorId,
        hasRating: !!revisionRating,
        rating: revisionRating || null,
        revisionType: revisionRecord.startPage ? 'page' : 'surah',
      });

      // Create instructor notes for revision if provided
      if (revisionInstructorNotes && Array.isArray(revisionInstructorNotes) && revisionInstructorNotes.length > 0) {
        // Validate max 20 notes per revision to prevent abuse
        if (revisionInstructorNotes.length > 20) {
          logger.warn(`sessionController: saveDailySession - Too many revision instructor notes submitted: ${revisionInstructorNotes.length}`, {
            logId,
            count: revisionInstructorNotes.length,
            revisionRecordId: createdRevisionRecord.id,
          });
        }

        const notesToCreate = revisionInstructorNotes.slice(0, 20);
        const createdNoteIds: number[] = [];

        for (const noteData of notesToCreate) {
          try {
            // Validate note content
            if (!noteData.content || typeof noteData.content !== 'string' || noteData.content.trim().length === 0) {
              logger.warn(`sessionController: saveDailySession - Skipping empty revision instructor note`, {
                logId,
                revisionRecordId: createdRevisionRecord.id,
              });
              continue;
            }

            const note = await instructorNoteService.createInstructorNote({
              tenant_id: tenantId,
              target_type: NoteTargetType.REVISION,
              target_id: createdRevisionRecord.id,
              instructor_id: instructorId!,
              student_id: Number(studentId),
              content: noteData.content,
              visibility: noteData.visibility === 'public' ? NoteVisibility.PUBLIC : NoteVisibility.PRIVATE,
              annotation_ref: noteData.annotationRef || null,
            }, logId);

            createdNoteIds.push(note.id);

            logger.info(`sessionController: saveDailySession - Instructor note created: ${note.id}`, {
              logId,
              noteId: note.id,
              revisionRecordId: createdRevisionRecord.id,
              instructorId,
              studentId: Number(studentId),
              visibility: note.visibility,
              contentLength: noteData.content.length,
            });
          } catch (noteError: any) {
            // Don't fail the whole request if a single note fails
            logger.error(`sessionController: saveDailySession - Failed to create instructor note: ${noteError.message}`, {
              logId,
              error: noteError.message,
              revisionRecordId: createdRevisionRecord.id,
            });
          }
        }

        if (createdNoteIds.length > 0) {
          logger.info(`sessionController: saveDailySession - Instructor notes batch created: count=${createdNoteIds.length}`, {
            logId,
            revisionRecordId: createdRevisionRecord.id,
            noteCount: createdNoteIds.length,
            noteIds: createdNoteIds,
          });
        }
      }
    }

    if (hasHifz || hasRevision) {
      ScheduleService.invalidateConflictCache(tenantId, Number(studentId), effectiveDate);
      logger.info(
        `sessionController: saveDailySession - Success: tenantId=${tenantId} studentId=${Number(studentId)} recordingDate=${effectiveDate}`,
        { logId }
      );
    }

    res.status(201).json({
      message: 'Session saved successfully',
      sessionId: session.id,
      memorizationRecordId: createdMemorizationRecord?.id ?? null,
      revisionRecordId: createdRevisionRecord?.id ?? null
    });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`sessionController: saveDailySession - Error: ${error.message}`, { logId });
    res.status(500).json({ error: error.message || 'Failed to save session' });
  }
};

export const checkDateConflict = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const studentId = Number(req.query.studentId);
  const date = String(req.query.date || '');

  if (!Number.isInteger(studentId) || studentId <= 0) {
    return res.status(400).json({ error: 'A valid studentId is required.' });
  }

  const dateValidation = ScheduleService.validateDateFormat(date);
  if (!dateValidation.isValid) {
    return res.status(400).json({ error: dateValidation.error, code: dateValidation.code });
  }

  try {
    const tenantId = getTenantId(req);
    logger.info(`sessionController: checkDateConflict - Checking conflicts for studentId: ${studentId}, date: ${date}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const school = await schoolService.getSchoolById(tenantId);
    if (school.schedule_mode !== 'advanced') {
      return res.json({
        hasMemorizationOnDate: false,
        hasRevisionOnDate: false,
      });
    }

    const conflicts = await ScheduleService.getDateConflictSnapshot(tenantId, studentId, date);
    return res.json(conflicts);
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`sessionController: checkDateConflict - Error: ${error.message}`, { logId });
    return res.status(500).json({ error: 'Failed to check date conflicts' });
  }
};

/**
 * Check if the authenticated instructor has logged any sessions.
 * Used by the frontend to decide whether to show first-time attention UI.
 */
export const getInstructorHasActivity = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const instructorId = req.user?.userId;

  if (!instructorId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const tenantId = getTenantId(req);
    logger.info(`sessionController: getInstructorHasActivity - Checking activity for instructorId: ${instructorId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const hasSessions = await sessionService.hasInstructorSessions(instructorId, tenantId);
    res.json({ hasActivity: hasSessions });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`sessionController: getInstructorHasActivity - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to check instructor activity' });
  }
};

/**
 * Get combined memorization (hifz) and revision history for a student.
 * GET /api/sessions/history/:studentId?type=hifz|revision|all&limit=10&offset=0
 */
export const getSessionHistory = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { studentId } = req.params;
  const { type = 'all', limit = '10', offset = '0' } = req.query as {
    type?: string;
    limit?: string;
    offset?: string;
  };

  const validTypes = ['hifz', 'revision', 'all'];
  if (type && !validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid type. Must be hifz, revision, or all.' });
  }

  const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 50);
  const offsetNum = Math.max(parseInt(offset, 10) || 0, 0);

  try {
    const tenantId = getTenantId(req);
    logger.info(`sessionController: getSessionHistory - Fetching history for studentId: ${studentId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId,
      type
    });
    const history = await sessionHistoryService.getSessionHistory(
      Number(studentId),
      tenantId,
      {
        type: type as 'hifz' | 'revision' | 'all',
        limit: limitNum,
        offset: offsetNum,
      }
    );

    res.json({
      success: true,
      data: history,
    });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`sessionController: getSessionHistory - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to fetch session history' });
  }
};

/**
 * Get student session history
 */
export const getStudentSessions = async (req: Request, res: Response) => {
  const logId = req.correlationId || 'unknown';
  const { studentId } = req.params;

  try {
    const tenantId = getTenantId(req);
    logger.info(`sessionController: getStudentSessions - Fetching sessions for studentId: ${studentId}, tenantId: ${tenantId}`, {
      logId,
      tenantId,
      activeSchoolContext: req.activeSchoolId,
      userId: req.user?.userId
    });
    const sessions = await sessionService.getStudentSessions(Number(studentId), tenantId);
    res.json({ sessions });
  } catch (error: any) {
    if (error.name === 'SchoolContextError') throw error;
    logger.error(`sessionController: getStudentSessions - Error: ${error.message}`, { logId });
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};
