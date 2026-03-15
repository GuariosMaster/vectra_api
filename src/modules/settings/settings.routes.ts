import { Router } from 'express';
import { get, update } from './settings.controller.js';
import { verifyToken, requireAdmin } from '../../middlewares/auth.middleware.js';

const router = Router();
router.get('/', get);
router.put('/', verifyToken, requireAdmin, update);

export default router;
