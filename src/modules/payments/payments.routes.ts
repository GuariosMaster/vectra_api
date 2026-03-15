import { Router } from 'express';
import { createPreference, webhook } from './payments.controller.js';
import { verifyToken, optionalAuth } from '../../middlewares/auth.middleware.js';

const router = Router();

router.post('/mp/create', optionalAuth, createPreference);
router.post('/mp/webhook', webhook); // public — MP calls this

export default router;
