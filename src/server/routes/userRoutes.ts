import { Router } from 'express';
import * as userController from '../controller/userController';
import { authenticate } from '../middleware/authMiddleware';
import { rateLimit } from '../middleware/rateLimitMiddleware';

const router = Router();

const authLimiter = rateLimit(60 * 1000, 10); // 10 requests per minute

router.post('/register', authLimiter, userController.register);
router.post('/login', authLimiter, userController.login);
router.post('/logout', userController.logout);
router.get('/me', authenticate, userController.getCurrentUser);

// Student Management
router.get('/students', authenticate, userController.getStudents);
router.post('/students', authenticate, userController.createStudent);
router.get('/students/search', authenticate, userController.searchStudents);
router.get('/students/:id', authenticate, userController.getStudentById);
router.put('/students/:id', authenticate, userController.updateStudent);
router.delete('/students/:id', authenticate, userController.deleteStudent);

export default router;
