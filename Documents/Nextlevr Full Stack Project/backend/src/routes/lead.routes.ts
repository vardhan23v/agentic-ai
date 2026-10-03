import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as leadController from '../controllers/lead.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET routes - accessible to all authenticated users
router.get('/', leadController.getLeads);
router.get('/pipeline', leadController.getPipeline);
router.get('/sources', leadController.getSources);
router.get('/:id', leadController.getLeadById);

// POST/PUT/DELETE - ADMIN and MANAGER only
router.post('/', requireRole('ADMIN', 'MANAGER'), leadController.createLead);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), leadController.updateLead);
router.patch('/:id/status', requireRole('ADMIN', 'MANAGER'), leadController.updateLeadStatus);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), leadController.deleteLead);

export default router;