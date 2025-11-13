import { z } from 'zod';

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().optional(),
  role: z.enum(['client', 'lawyer', 'admin'])
});

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(10)
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
});
