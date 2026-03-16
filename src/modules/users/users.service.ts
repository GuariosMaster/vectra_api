import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import type { UpdateUserBody, UserQuery } from './users.schemas.js';

const userSelect = {
  id: true,
  email: true,
  role: true,
  firstName: true,
  lastName: true,
  phone: true,
  lang: true,
  isActive: true,
  googleId: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { orders: true } },
};

export async function listUsers(query: UserQuery) {
  const { page, limit, skip } = getPagination({ page: String(query.page), limit: String(query.limit) });

  const where: Record<string, unknown> = {};
  if (query.role) where['role'] = query.role;
  if (query.isActive !== undefined) where['isActive'] = query.isActive === 'true';
  if (query.search) {
    where['OR'] = [
      { email: { contains: query.search, mode: 'insensitive' } },
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({ where, select: userSelect, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.user.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: userSelect });
  if (!user) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'User not found');
  return user;
}

export async function updateUser(id: string, body: UpdateUserBody) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'User not found');
  return prisma.user.update({ where: { id }, data: body, select: userSelect });
}

export async function deleteUser(id: string, requesterId: string) {
  if (id === requesterId) {
    throw new AppError(HTTP_STATUS.FORBIDDEN, ERROR_CODES.FORBIDDEN, 'Cannot delete your own account');
  }
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'User not found');
  await prisma.user.delete({ where: { id } });
}
