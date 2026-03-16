import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
});

export const googleSchema = z.object({
  idToken: z.string().min(1, 'Google idToken is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});

export type LoginBody    = z.infer<typeof loginSchema>;
export type RegisterBody = z.infer<typeof registerSchema>;
export type GoogleBody   = z.infer<typeof googleSchema>;
