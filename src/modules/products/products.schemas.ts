import { z } from 'zod';

// Correctly handles boolean strings from FormData ("true"/"false") as well as real booleans
const boolFromForm = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .transform((v) => v === true || v === 'true');

// Handles tagIds sent as repeated FormData fields (multer gives string or string[])
const tagIdsFromForm = z.preprocess(
  (val) => {
    if (val === undefined || val === null) return [];
    if (Array.isArray(val)) return val;
    return [val];
  },
  z.array(z.string().uuid()),
);

export const createProductSchema = z.object({
  slug: z.string().min(1),
  nameEs: z.string().min(1),
  nameEn: z.string().optional(),
  shortDescEs: z.string().min(1),
  shortDescEn: z.string().optional(),
  descriptionEs: z.string().min(1),
  descriptionEn: z.string().optional(),
  price: z.coerce.number().positive(),
  comparePrice: z.coerce.number().positive().optional(),
  stock: z.coerce.number().int().min(0).default(0),
  inStock: boolFromForm.default(true),
  featured: boolFromForm.default(false),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  weight: z.string().optional(),
  printTime: z.string().optional(),
  categoryId: z.string().uuid(),
  tagIds: tagIdsFromForm.default([]),
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
