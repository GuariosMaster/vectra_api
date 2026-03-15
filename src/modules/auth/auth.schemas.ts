import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const googleSchema = z.object({
  idToken: z.string().min(1, 'Google idToken is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export type LoginBody = z.infer<typeof loginSchema>;
export type GoogleBody = z.infer<typeof googleSchema>;
