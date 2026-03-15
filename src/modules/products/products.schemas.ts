import { z } from 'zod';

export const createProductSchema = z.object({
  slug: z.string().min(1),
  nameEs: z.string().min(1),
  nameEn: z.string().min(1),
  shortDescEs: z.string().min(1),
  shortDescEn: z.string().min(1),
  descriptionEs: z.string().min(1),
  descriptionEn: z.string().min(1),
  price: z.coerce.number().positive(),
  comparePrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  inStock: z.coerce.boolean().default(true),
  featured: z.coerce.boolean().default(false),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  printTime: z.string().optional(),
  categoryId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()).default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const productQuerySchema = z.object({
  category: z.string().optional(),
  featured: z.enum(['true', 'false']).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  search: z.string().optional(),
  lang: z.enum(['ES', 'EN']).default('ES'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateProductBody = z.infer<typeof createProductSchema>;
export type UpdateProductBody = z.infer<typeof updateProductSchema>;
export type ProductQuery = z.infer<typeof productQuerySchema>;
