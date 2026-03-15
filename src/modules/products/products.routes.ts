import { Router } from 'express';
import * as controller from './products.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyToken, requireAdmin } from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import { createProductSchema, updateProductSchema, productQuerySchema } from './products.schemas.js';

const router = Router();

router.get('/', validate(productQuerySchema, 'query'), controller.list);
router.get('/:slug', controller.get);

router.post(
  '/',
  verifyToken, requireAdmin,
  upload.array('images', 10),
  validate(createProductSchema),
  controller.create
);
router.put(
  '/:id',
  verifyToken, requireAdmin,
  upload.array('images', 10),
  validate(updateProductSchema),
  controller.update
);
router.delete('/:id', verifyToken, requireAdmin, controller.remove);

export default router;
