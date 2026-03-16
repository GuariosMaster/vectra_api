import { Router } from 'express';
import * as controller from './users.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyToken, requireAdmin } from '../../middlewares/auth.middleware.js';
import { updateUserSchema, userQuerySchema } from './users.schemas.js';

const router = Router();

router.use(verifyToken, requireAdmin);

router.get('/', validate(userQuerySchema, 'query'), controller.list);
router.get('/:id', controller.get);
router.put('/:id', validate(updateUserSchema), controller.update);
router.delete('/:id', controller.remove);

export default router;
