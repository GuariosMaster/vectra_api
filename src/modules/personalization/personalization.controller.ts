import type { Request, Response, NextFunction } from 'express';
import * as svc from './personalization.service.js';
import { sendSuccess, sendList } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';
import type { PersonalizationQuery } from './personalization.schemas.js';

export async function submit(req: Request, res: Response, next: NextFunction) {
  try {
    const image = (req.file as Express.Multer.File | undefined)?.buffer;
    const result = await svc.submitRequest(req.body, image, req.user?.id);
    sendSuccess(res, result, HTTP_STATUS.CREATED);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { items, meta } = await svc.listRequests(req.query as unknown as PersonalizationQuery);
    sendList(res, items, meta);
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.getRequest(req.params['id'] as string));
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    sendSuccess(res, await svc.updateRequest(req.params['id'] as string, req.body));
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deleteRequest(req.params['id'] as string);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) { next(err); }
}
