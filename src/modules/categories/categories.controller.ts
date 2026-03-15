import type { Request, Response, NextFunction } from 'express';
import { listCategories } from './categories.service.js';
import { sendSuccess } from '../../utils/response.js';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await listCategories();
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}
