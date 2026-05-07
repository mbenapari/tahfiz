import { Router } from 'express';
import * as userController from '../controller/userController';
import * as feedbackController from '../controller/feedbackController';
import { authenticate } from '../middleware/authMiddleware';
import { rateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

const authLimiter = rateLimit(60 * 1000, 10); // 10 requests per minute

router.post('/register', authLimiter, userController.register);
router.post('/login', authLimiter, userController.login);
router.get('/me', authenticate, userController.getCurrentUser);
router.put('/me', authenticate, userController.updateCurrentUser);
router.post('/onboarding/complete', authenticate, userController.completeOnboarding);

// Feedback
router.post('/feedback', authenticate, feedbackController.submitFeedback);

// Student Management
router.get('/students', authenticate, userController.getStudents);
router.post('/students', authenticate, userController.createStudent);
router.get('/students/search', authenticate, userController.searchStudents);
router.get('/students/:id', authenticate, userController.getStudentById);
router.put('/students/:id', authenticate, userController.updateStudent);
router.delete('/students/:id', authenticate, userController.deleteStudent);

// Instructor Management
router.get('/instructors', authenticate, userController.getInstructors);
router.post('/instructors', authenticate, userController.createInstructor);
router.get('/instructors/:id', authenticate, userController.getInstructorById);
router.put('/instructors/:id', authenticate, userController.updateInstructor);
router.delete('/instructors/:id', authenticate, userController.deleteInstructor);

export default router;
