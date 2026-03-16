import { z } from 'zod';

export const createPostSchema = z.object({
  slug: z.string().min(1),
  titleEs: z.string().min(1),
  titleEn: z.string().optional(),
  excerptEs: z.string().min(1),
  excerptEn: z.string().optional(),
  contentEs: z.string().min(1),
  contentEn: z.string().optional(),
  coverImage: z.string().url(),
  author: z.string().min(1),
  draft: z.coerce.boolean().default(true),
  publishedAt: z.coerce.date().optional(),
  tagIds: z.array(z.string().uuid()).default([]),
});

export const updatePostSchema = createPostSchema.partial();

export const blogQuerySchema = z.object({
  lang: z.enum(['ES', 'EN']).default('ES'),
  tag: z.string().optional(),
  draft: z.enum(['true', 'false']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export type CreatePostBody = z.infer<typeof createPostSchema>;
export type UpdatePostBody = z.infer<typeof updatePostSchema>;
export type BlogQuery = z.infer<typeof blogQuerySchema>;
