import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as activityController from '../controllers/activity.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

router.get('/', activityController.getActivities);

export default router;
