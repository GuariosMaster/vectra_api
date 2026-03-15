import { Router } from 'express';
import * as controller from './personalization.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyToken, requireAdmin, optionalAuth } from '../../middlewares/auth.middleware.js';
import { upload } from '../../middlewares/upload.middleware.js';
import {
  createPersonalizationSchema,
  updatePersonalizationSchema,
  personalizationQuerySchema,
} from './personalization.schemas.js';

const router = Router();

router.post(
  '/',
  optionalAuth,
  upload.single('referenceImage'),
  validate(createPersonalizationSchema),
  controller.submit
);

router.get('/', verifyToken, requireAdmin, validate(personalizationQuerySchema, 'query'), controller.list);
router.get('/:id', verifyToken, requireAdmin, controller.get);
router.put('/:id', verifyToken, requireAdmin, validate(updatePersonalizationSchema), controller.update);
router.delete('/:id', verifyToken, requireAdmin, controller.remove);

export default router;
