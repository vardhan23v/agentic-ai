import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as taskController from '../controllers/task.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET routes - accessible to all authenticated users
router.get('/', taskController.getTasks);
router.get('/my', taskController.getMyTasks);
router.get('/stats', taskController.getTaskStats);
router.get('/:id', taskController.getTaskById);

// POST/PUT/DELETE - ADMIN and MANAGER only
router.post(
  '/',
  requireRole('ADMIN', 'MANAGER'),
  taskController.createTask
);
router.put(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  taskController.updateTask
);
router.patch(
  '/:id/status',
  requireRole('ADMIN', 'MANAGER', 'TEAM_MEMBER'),
  taskController.updateTaskStatus
);
router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  taskController.deleteTask
);

export default router;