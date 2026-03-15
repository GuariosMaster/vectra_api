import type { Request, Response, NextFunction } from 'express';
import * as svc from './blog.service.js';
import { sendSuccess, sendList } from '../../utils/response.js';
import { HTTP_STATUS, ROLES } from '../../config/constants.js';
import type { BlogQuery } from './blog.schemas.js';

export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const isAdmin = req.user?.role === ROLES.ADMIN;
    const { items, meta } = await svc.listPosts(req.query as unknown as BlogQuery, isAdmin);
    sendList(res, items, meta);
  } catch (err) { next(err); }
}

export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await svc.getPostBySlug(req.params['slug'] as string);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await svc.createPost(req.body);
    sendSuccess(res, post, HTTP_STATUS.CREATED);
  } catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const post = await svc.updatePost(req.params['id'] as string, req.body);
    sendSuccess(res, post);
  } catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await svc.deletePost(req.params['id'] as string);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  } catch (err) { next(err); }
}
