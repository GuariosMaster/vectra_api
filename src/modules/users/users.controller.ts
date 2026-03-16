import type { Request, Response, NextFunction } from 'express';
import * as svc from './users.service.js';
import { sendSuccess, sendList } from '../../utils/response.js';
import { HTTP_STATUS } from '../../config/constants.js';
import type { UserQuery } from './users.schemas.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const { items, meta } = await svc.listUsers(req.query as unknown as UserQuery);
    sendList(res, items, meta);
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await svc.getUser(req.params['id'] as string);
    sendSuccess(res, user);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await svc.updateUser(req.params['id'] as string, req.body);
    sendSuccess(res, user);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deleteUser(req.params['id'] as string, req.user!.id);
    res.status(HTTP_STATUS.NO_CONTENT).end();
  } catch (err) { next(err); }
}
