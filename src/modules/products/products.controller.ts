import type { Request, Response, NextFunction } from 'express';
import * as svc from './products.service.js';
import { sendSuccess, sendList } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';
import type { ProductQuery } from './products.schemas.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { items, meta } = await svc.listProducts(req.query as unknown as ProductQuery);
    sendList(res, items, meta);
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const product = await svc.getProductBySlug(req.params['slug'] as string);
    sendSuccess(res, product);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const files = (req.files as Express.Multer.File[] | undefined)?.map((f) => f.buffer);
    const product = await svc.createProduct(req.body, files);
    sendSuccess(res, product, HTTP_STATUS.CREATED);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const files = (req.files as Express.Multer.File[] | undefined)?.map((f) => f.buffer);
    const product = await svc.updateProduct(req.params['id'] as string, req.body, files);
    sendSuccess(res, product);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deleteProduct(req.params['id'] as string);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) { next(err); }
}
