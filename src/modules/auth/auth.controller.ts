import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';

const COOKIE_NAME = 'vectra_refresh';
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'strict' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { accessToken, refreshToken, user } = await authService.register(req.body);
    res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
    sendSuccess(res, { accessToken, user }, 201);
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { accessToken, refreshToken, user } = await authService.loginWithPassword(req.body);
    res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
    sendSuccess(res, { accessToken, user });
  } catch (err) {
    next(err);
  }
}

export async function googleLogin(req: Request, res: Response, next: NextFunction) {
  try {
    const { accessToken, refreshToken, user } = await authService.loginWithGoogle(req.body.idToken);
    res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
    sendSuccess(res, { accessToken, user });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME] ?? req.body?.refreshToken;
    if (!token) {
      sendError(res, HTTP_STATUS.UNAUTHORIZED, {
        code: ERROR_CODES.UNAUTHORIZED,
        message: 'No refresh token',
      });
      return;
    }
    const { accessToken, refreshToken } = await authService.refreshTokens(token);
    res.cookie(COOKIE_NAME, refreshToken, COOKIE_OPTIONS);
    sendSuccess(res, { accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) await authService.logout(token);
    res.clearCookie(COOKIE_NAME, { path: '/' });
    sendSuccess(res, { message: 'Logged out' });
  } catch (err) {
    next(err);
  }
}

export async function profile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await authService.getProfile(req.user!.id);
    sendSuccess(res, user);
  } catch (err) {
    next(err);
  }
}
