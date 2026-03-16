import type { Request, Response, NextFunction } from 'express';
import { listCategories, createCategory, deleteCategory } from './categories.service.js';
import { sendSuccess } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';

export async function list(_req: Request, res: Response, next: NextFunction) {
  try {
    const categories = await listCategories();
    sendSuccess(res, categories);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const category = await createCategory(req.body as { slug: string; nameEs: string });
    sendSuccess(res, category, HTTP_STATUS.CREATED);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await deleteCategory(req.params['id'] as string);
    res.status(HTTP_STATUS.NO_CONTENT).end();
  } catch (err) { next(err); }
}
