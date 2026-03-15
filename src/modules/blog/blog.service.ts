import { prisma } from '../../config/database.js';
import { AppError } from '../../middlewares/error.middleware.js';
import { HTTP_STATUS, ERROR_CODES } from '../../config/constants.js';
import { getPagination, buildMeta } from '../../utils/pagination.js';
import type { CreatePostBody, UpdatePostBody, BlogQuery } from './blog.schemas.js';

const postInclude = { tags: { include: { tag: true } } };

export async function listPosts(query: BlogQuery, isAdmin = false) {
  const { page, limit, skip } = getPagination({ page: String(query.page), limit: String(query.limit) });

  const where: Record<string, unknown> = {};
  if (!isAdmin) where.draft = false;
  else if (query.draft !== undefined) where.draft = query.draft === 'true';
  if (query.tag) where.tags = { some: { tag: { slug: query.tag } } };

  const [items, total] = await Promise.all([
    prisma.post.findMany({ where, include: postInclude, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.post.count({ where }),
  ]);

  return { items, meta: buildMeta(page, limit, total) };
}

export async function getPostBySlug(slug: string) {
  const post = await prisma.post.findUnique({ where: { slug }, include: postInclude });
  if (!post) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Post not found');
  return post;
}

export async function createPost(body: CreatePostBody) {
  const { tagIds, ...data } = body;

  const existing = await prisma.post.findUnique({ where: { slug: data.slug } });
  if (existing) throw new AppError(HTTP_STATUS.CONFLICT, ERROR_CODES.CONFLICT, 'Slug already exists');

  return prisma.post.create({
    data: { ...data, tags: { create: tagIds.map((tagId) => ({ tagId })) } },
    include: postInclude,
  });
}

export async function updatePost(id: string, body: UpdatePostBody) {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Post not found');

  const { tagIds, ...data } = body;

  return prisma.post.update({
    where: { id },
    data: {
      ...data,
      ...(tagIds !== undefined && {
        tags: { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) },
      }),
    },
    include: postInclude,
  });
}

export async function deletePost(id: string) {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) throw new AppError(HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'Post not found');
  await prisma.post.delete({ where: { id } });
}
