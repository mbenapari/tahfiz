import { Router } from 'express';
import * as ownerMgmt from '../controller/ownerManagementController';
import { authenticate } from '../middleware/authMiddleware';
import ownerOnly from '../middleware/ownerAuthMiddleware';

const router = Router();

// All management endpoints require owner authentication
router.use(authenticate, ownerOnly);

// Schools
router.get('/schools', ownerMgmt.listSchools);
router.post('/schools', ownerMgmt.createSchool);
router.put('/schools/:id', ownerMgmt.updateSchool);
router.delete('/schools/:id', ownerMgmt.deleteSchool);

// Users
router.get('/users', ownerMgmt.listUsers);
router.post('/users', ownerMgmt.createUser);
router.put('/users/:id', ownerMgmt.updateUser);
router.delete('/users/:id', ownerMgmt.deleteUser);

// System Owners
router.get('/owners', ownerMgmt.listOwners);
router.post('/owners', ownerMgmt.createOwner);
router.put('/owners/:id', ownerMgmt.updateOwner);
router.delete('/owners/:id', ownerMgmt.deleteOwner);

export default router;
