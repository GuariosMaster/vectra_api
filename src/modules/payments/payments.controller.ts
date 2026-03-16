import type { Request, Response, NextFunction } from 'express';
import { createMpPreference, handleMpWebhook } from './payments.service.js';
import { sendSuccess } from '../../utils/response.js';

export async function createPreference(req: Request, res: Response, next: NextFunction) {
  try {
    const { orderId } = req.body as { orderId: string };
    const result = await createMpPreference(orderId);
    sendSuccess(res, result);
  } catch (err) {
    console.error('[createPreference] MP error:', JSON.stringify(err, null, 2));
    next(err);
  }
}

export async function webhook(req: Request, res: Response, next: NextFunction) {
  try {
    const sig = req.headers['x-signature'] as string | undefined;
    const result = await handleMpWebhook(req.body, sig);
    sendSuccess(res, result);
  } catch (err) { next(err); }
}
