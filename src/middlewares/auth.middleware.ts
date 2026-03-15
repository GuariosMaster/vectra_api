import type { Request, Response, NextFunction, RequestHandler } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { HTTP_STATUS, ERROR_CODES, ROLES } from '../config/constants.js';
import { sendError } from '../utils/response.js';

export const verifyToken: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    sendError(res, HTTP_STATUS.UNAUTHORIZED, {
      code: ERROR_CODES.UNAUTHORIZED,
      message: 'No token provided',
    });
    return;
  }

  try {
    const token = auth.slice(7);
    req.user = verifyAccessToken(token);
    next();
  } catch {
    sendError(res, HTTP_STATUS.UNAUTHORIZED, {
      code: ERROR_CODES.TOKEN_INVALID,
      message: 'Invalid or expired token',
    });
  }
};

export const requireAdmin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== ROLES.ADMIN) {
    sendError(res, HTTP_STATUS.FORBIDDEN, {
      code: ERROR_CODES.FORBIDDEN,
      message: 'Admin access required',
    });
    return;
  }
  next();
};

export const optionalAuth: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    try {
      req.user = verifyAccessToken(auth.slice(7));
    } catch {
      // ignore invalid token — user stays unauthenticated
    }
  }
  next();
};
