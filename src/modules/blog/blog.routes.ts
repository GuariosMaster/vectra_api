import { Router } from 'express';
import * as controller from './blog.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyToken, requireAdmin, optionalAuth } from '../../middlewares/auth.middleware.js';
import { createPostSchema, updatePostSchema, blogQuerySchema } from './blog.schemas.js';

const router = Router();

router.get('/', optionalAuth, validate(blogQuerySchema, 'query'), controller.list);
router.get('/:slug', controller.get);

router.post('/', verifyToken, requireAdmin, validate(createPostSchema), controller.create);
router.put('/:id', verifyToken, requireAdmin, validate(updatePostSchema), controller.update);
router.delete('/:id', verifyToken, requireAdmin, controller.remove);

export default router;
