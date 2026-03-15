import type { Request, Response, NextFunction } from 'express';
import { getSettings, updateSettings } from './settings.service.js';
import { sendSuccess } from '../../utils/response.js';

export async function get(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await getSettings());
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await updateSettings(req.body));
  } catch (err) { next(err); }
}
