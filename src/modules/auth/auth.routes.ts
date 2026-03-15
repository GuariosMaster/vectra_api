import { Router } from 'express';
import * as controller from './auth.controller.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { verifyToken } from '../../middlewares/auth.middleware.js';
import { loginSchema, googleSchema } from './auth.schemas.js';

const router = Router();

router.post('/login', validate(loginSchema), controller.login);
router.post('/google', validate(googleSchema), controller.googleLogin);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.get('/profile', verifyToken, controller.profile);

export default router;
