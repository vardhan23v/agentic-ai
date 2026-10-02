import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import * as userController from '../controllers/user.controller';

const router = Router();

router.use(requireAuth);
router.get('/', userController.getUsers);

export default router;
