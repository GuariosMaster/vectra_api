import { OAuth2Client } from 'google-auth-library';
import { prisma } from '../../config/database.js';
import { env } from '../../config/env.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt.js';
import { hashPassword, comparePassword } from '../../utils/hash.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';
import type { LoginBody } from './auth.schemas.js';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

async function issueTokens(userId: string, role: string) {
  const payload = { id: userId, role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
    },
  });

  return { accessToken, refreshToken };
}

export async function loginWithPassword(body: LoginBody) {
  const user = await prisma.user.findUnique({ where: { email: body.email } });

  if (!user || !user.passwordHash) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password');
  }

  const valid = await comparePassword(body.password, user.passwordHash);
  if (!valid) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.INVALID_CREDENTIALS, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, 'Account disabled');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const tokens = await issueTokens(user.id, user.role);
  const { passwordHash: _, ...safeUser } = user;
  return { ...tokens, user: safeUser };
}

export async function loginWithGoogle(idToken: string) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new AppError(HTTP_STATUS.INTERNAL, ERROR_CODES.INTERNAL_ERROR, 'Google OAuth not configured');
  }

  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();

  if (!payload?.sub || !payload.email) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.UNAUTHORIZED, 'Invalid Google token');
  }

  const { sub: googleId, email, given_name: firstName, family_name: lastName } = payload;

  let user = await prisma.user.findFirst({
    where: { OR: [{ googleId }, { email }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: { email, googleId, firstName, lastName },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
  }

  if (!user.isActive) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, 'Account disabled');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  const tokens = await issueTokens(user.id, user.role);
  const { passwordHash: _, ...safeUser } = user;
  return { ...tokens, user: safeUser };
}

export async function refreshTokens(rawToken: string) {
  let payload: { id: string; role: string };
  try {
    payload = verifyRefreshToken(rawToken);
  } catch {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_INVALID, 'Invalid refresh token');
  }

  const stored = await prisma.refreshToken.findUnique({ where: { token: rawToken } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError(HTTP_STATUS.UNAUTHORIZED, ERROR_CODES.TOKEN_EXPIRED, 'Refresh token expired');
  }

  // Rotate token
  await prisma.refreshToken.delete({ where: { token: rawToken } });

  return issueTokens(payload.id, payload.role);
}

export async function logout(rawToken: string) {
  await prisma.refreshToken.deleteMany({ where: { token: rawToken } });
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, role: true, firstName: true, lastName: true,
      phone: true, lang: true, isActive: true, createdAt: true, lastLoginAt: true,
    },
  });
  if (!user) {
    throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'User not found');
  }
  return user;
}
