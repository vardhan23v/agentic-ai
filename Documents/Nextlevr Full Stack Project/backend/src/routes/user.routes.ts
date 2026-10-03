import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as userController from '../controllers/user.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// Admin-only routes
router.get('/', requireRole('ADMIN'), userController.getUsers);
router.post('/', requireRole('ADMIN'), userController.createUser);
router.delete('/:id', requireRole('ADMIN'), userController.disableUser);

// Self-service profile update and user lookup (authorization enforced in controller)
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);

export default router;
