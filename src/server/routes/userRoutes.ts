import { Router } from 'express';
import * as authController from '../controller/authController';
import * as profileController from '../controller/profileController';
import * as studentController from '../controller/studentController';
import * as instructorController from '../controller/instructorController';
import * as feedbackController from '../controller/feedbackController';
import { authenticate, checkPermission } from '../middleware/authMiddleware';
import { rateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

const authLimiter = rateLimit(60 * 1000, 10); // 10 requests per minute

// Auth
router.post('/register', authLimiter, authController.register);
router.post('/login', authLimiter, authController.login);
router.post('/logout', authController.logout);

// Profile
router.get('/me', authenticate, profileController.getCurrentUser);
router.put('/me', authenticate, profileController.updateCurrentUser);
router.post('/onboarding/complete', authenticate, profileController.completeOnboarding);

// Feedback
router.post('/feedback', authenticate, feedbackController.submitFeedback);

// Student Management
router.get('/students', authenticate, studentController.getStudents);
router.post('/students', authenticate, checkPermission('student:write'), studentController.createStudent);
router.get('/students/search', authenticate, studentController.searchStudents);
router.get('/students/:id', authenticate, studentController.getStudentById);
router.put('/students/:id', authenticate, checkPermission('student:write'), studentController.updateStudent);
router.delete('/students/:id', authenticate, checkPermission('student:delete'), studentController.deleteStudent);

// Instructor Management
router.get('/instructors', authenticate, instructorController.getInstructors);
router.post('/instructors', authenticate, checkPermission('instructor:write'), instructorController.createInstructor);
router.get('/instructors/:id', authenticate, instructorController.getInstructorById);
router.put('/instructors/:id', authenticate, checkPermission('instructor:write'), instructorController.updateInstructor);
router.delete('/instructors/:id', authenticate, checkPermission('instructor:delete'), instructorController.deleteInstructor);

export default router;
