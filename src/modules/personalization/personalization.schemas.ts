import { z } from 'zod';

export const createPersonalizationSchema = z.object({
  description: z.string().min(10),
  referenceUrl: z.string().url().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  lang: z.enum(['ES', 'EN']).default('ES'),
});

export const updatePersonalizationSchema = z.object({
  status: z.enum(['PENDING', 'IN_REVIEW', 'QUOTED', 'ACCEPTED', 'REJECTED']).optional(),
  adminNotes: z.string().optional(),
  quotedPrice: z.coerce.number().positive().optional(),
});

export const personalizationQuerySchema = z.object({
  status: z.enum(['PENDING', 'IN_REVIEW', 'QUOTED', 'ACCEPTED', 'REJECTED']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(20),
});

export type CreatePersonalizationBody = z.infer<typeof createPersonalizationSchema>;
export type UpdatePersonalizationBody = z.infer<typeof updatePersonalizationSchema>;
export type PersonalizationQuery = z.infer<typeof personalizationQuerySchema>;
