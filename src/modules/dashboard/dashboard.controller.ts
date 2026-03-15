import type { Request, Response, NextFunction } from 'express';
import { getDashboardStats } from './dashboard.service.js';
import { sendSuccess } from '../../utils/response.js';

export async function stats(_req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await getDashboardStats());
  } catch (err) { next(err); }
}
