import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as campaignController from '../controllers/campaign.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET routes - accessible to all authenticated users
router.get('/', campaignController.getCampaigns);
router.get('/my', campaignController.getMyCampaigns);
router.get('/:id', campaignController.getCampaignById);

// POST/PUT/DELETE - ADMIN and MANAGER only
router.post(
  '/',
  requireRole('ADMIN', 'MANAGER'),
  campaignController.createCampaign
);
router.put(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  campaignController.updateCampaign
);
router.delete(
  '/:id',
  requireRole('ADMIN', 'MANAGER'),
  campaignController.deleteCampaign
);

export default router;