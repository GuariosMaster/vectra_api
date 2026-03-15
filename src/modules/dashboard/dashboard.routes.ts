import { Router } from 'express';
import { stats } from './dashboard.controller.js';
import { verifyToken, requireAdmin } from '../../middlewares/auth.middleware.js';

const router = Router();
router.get('/', verifyToken, requireAdmin, stats);

export default router;
