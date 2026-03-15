import { Router } from 'express';
import * as controller from './orders.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyToken, requireAdmin, optionalAuth } from '../../middlewares/auth.middleware.js';
import { createOrderSchema, updateStatusSchema, orderQuerySchema } from './orders.schemas.js';

const router = Router();

router.post('/', optionalAuth, validate(createOrderSchema), controller.create);
router.get('/', verifyToken, validate(orderQuerySchema, 'query'), controller.list);
router.get('/:id', verifyToken, controller.get);
router.put('/:id/status', verifyToken, requireAdmin, validate(updateStatusSchema), controller.updateStatus);

export default router;
