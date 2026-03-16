import { Router } from 'express';
import { list, create, remove } from './categories.controller.js';
import { verifyToken, requireAdmin } from '../../middlewares/auth.middleware.js';

const router = Router();
router.get('/', list);
router.post('/', verifyToken, requireAdmin, create);
router.delete('/:id', verifyToken, requireAdmin, remove);

export default router;
