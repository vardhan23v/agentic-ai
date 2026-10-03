import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import * as clientController from '../controllers/client.controller';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// GET routes - accessible to all authenticated users
// GET routes - accessible to all authenticated users
router.get('/', clientController.getClients);
router.get('/industries', clientController.getIndustries);
router.get('/:id', clientController.getClientById);
router.get('/:id/campaigns', clientController.getClientCampaigns);
router.get('/:id', clientController.getClientById);

// POST/PUT/DELETE - ADMIN and MANAGER only
router.post('/', requireRole('ADMIN', 'MANAGER'), clientController.createClient);
router.put('/:id', requireRole('ADMIN', 'MANAGER'), clientController.updateClient);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), clientController.deleteClient);

export default router;