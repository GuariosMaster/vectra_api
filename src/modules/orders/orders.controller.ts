import type { Request, Response, NextFunction } from 'express';
import * as svc from './orders.service.js';
import { sendSuccess, sendList } from '../../utils/response.js';
import { HTTP_STATUS, ROLES } from '../../config/constants.js';
import type { OrderQuery } from './orders.schemas.js';

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await svc.createOrder(req.body, req.user?.id);
    sendSuccess(res, order, HTTP_STATUS.CREATED);
  } catch (err) { next(err); }
}

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const isAdmin = req.user?.role === ROLES.ADMIN;
    const { items, meta } = await svc.listOrders(req.query as unknown as OrderQuery, req.user?.id, isAdmin);
    sendList(res, items, meta);
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const isAdmin = req.user?.role === ROLES.ADMIN;
    const order = await svc.getOrder(req.params['id'] as string, req.user?.id, isAdmin);
    sendSuccess(res, order);
  } catch (err) { next(err); }
}

export async function updateStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const order = await svc.updateOrderStatus(req.params['id'] as string, req.body);
    sendSuccess(res, order);
  } catch (err) { next(err); }
}
