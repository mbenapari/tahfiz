import { Request, Response } from 'express';
import * as sessionService from '../services/sessionService';
import * as memorizationService from '../services/memorizationService';
import * as revisionService from '../services/revisionService';
import * as surahService from '../services/surahService';
import * as attendanceService from '../services/attendanceService';
import * as progressService from '../services/progressService';
import { RecordType } from '../model/MemorizationRecord';
import logger from '../utils/logger';

/**
 * Save a daily session for a student
 * This includes the session metadata and memorization records
 */
export const saveDailySession = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const tenantId = req.user?.tenantId;
  const instructorId = (req.user as any)?.id;
  const { studentId, sessionDate, notes, hifzRecord, revisionRecord, attendance } = req.body;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
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
      // Surah-based revision (ayah range)
      if (revisionRecord.surahNumber) {
        if (!revisionRecord.startAyah || !revisionRecord.endAyah) {
          return res.status(400).json({ error: 'Revision record must include a start and end ayah' });
        }

        if (Number(revisionRecord.startAyah) > Number(revisionRecord.endAyah)) {
          return res.status(400).json({ error: 'Revision start cannot be greater than end' });
        }

        const surah = await surahService.getSurahByNumber(Number(revisionRecord.surahNumber));
        if (!surah) {
          return res.status(400).json({ error: `Invalid revision surah number: ${revisionRecord.surahNumber}` });
        }
        if (Number(revisionRecord.endAyah) > surah.ayah_count) {
          return res.status(400).json({ error: `Revision end ayah cannot be more than ${surah.ayah_count} (total ayahs in ${surah.name})` });
        }
      }

      // Surah range revision
      if (revisionRecord.startSurahNumber && revisionRecord.endSurahNumber) {
        if (Number(revisionRecord.startSurahNumber) > Number(revisionRecord.endSurahNumber)) {
          return res.status(400).json({ error: 'Start surah cannot be greater than end surah' });
        }
        
        // Validate both surahs exist
        const startSurah = await surahService.getSurahByNumber(Number(revisionRecord.startSurahNumber));
        const endSurah = await surahService.getSurahByNumber(Number(revisionRecord.endSurahNumber));
        
        if (!startSurah || !endSurah) {
          return res.status(400).json({ error: 'Invalid surah range' });
        }
      }

      // Page-based revision
      if (revisionRecord.startPage || revisionRecord.endPage) {
        if (!revisionRecord.startPage || !revisionRecord.endPage) {
          return res.status(400).json({ error: 'Revision record must include a start and end page' });
        }

        if (Number(revisionRecord.startPage) > Number(revisionRecord.endPage)) {
          return res.status(400).json({ error: 'Revision start page cannot be greater than end page' });
        }
      }
    }

    // 1. Create the main session record
    const session = await sessionService.createSession({
      tenant_id: tenantId,
      student_id: Number(studentId),
      instructor_id: instructorId,
      session_date: sessionDate,
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
        notes: revisionRecord.notes || ''
      });
    }

    res.status(201).json({
      message: 'Session saved successfully',
      sessionId: session.id,
      memorizationRecordId: createdMemorizationRecord?.id ?? null,
      revisionRecordId: createdRevisionRecord?.id ?? null
    });
  } catch (error: any) {
    logger.error('sessionController.saveDailySession: Error', { correlationId, error: error.message, stack: error.stack });
    res.status(500).json({ error: error.message || 'Failed to save session' });
  }
};

/**
 * Get student session history
 */
export const getStudentSessions = async (req: Request, res: Response) => {
  const correlationId = req.correlationId;
  const { studentId } = req.params;
  const tenantId = req.user?.tenantId;

  if (!tenantId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const sessions = await sessionService.getStudentSessions(Number(studentId), tenantId);
    res.json({ sessions });
  } catch (error: any) {
    logger.error('sessionController.getStudentSessions: Error', { correlationId, error: error.message });
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
};
