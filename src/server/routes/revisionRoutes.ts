import { Router } from 'express';
import * as revisionController from '../controller/revisionController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// Performance rating
router.put('/:revisionRecordId/rating', authenticate, revisionController.updateRevisionRating);
router.get('/:revisionRecordId/rating', authenticate, revisionController.getRevisionRating);

// Student aggregate stats
router.get('/stats/:studentId', authenticate, revisionController.getStudentRevisionStats);

// Instructor notes for revision records
router.get('/:revisionRecordId/notes', authenticate, revisionController.getRevisionNotes);
router.post('/:revisionRecordId/notes', authenticate, revisionController.createRevisionNote);

// Individual note operations (by note ID)
router.put('/notes/:noteId', authenticate, revisionController.updateRevisionNote);
router.delete('/notes/:noteId', authenticate, revisionController.deleteRevisionNote);

export default router;
