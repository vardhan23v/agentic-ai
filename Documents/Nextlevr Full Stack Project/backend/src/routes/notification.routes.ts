import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as notificationController from '../controllers/notification.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.get('/', notificationController.getNotifications);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

export default router;
