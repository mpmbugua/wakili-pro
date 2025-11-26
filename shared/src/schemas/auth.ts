import { z } from 'zod';

export const LoginSchema = z.object({
  identifier: z.string().min(1, 'Phone number or email is required'), // Can be phone or email
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email format').optional().or(z.literal('').transform(() => undefined)),
  password: z.string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=])/, 'Password must contain uppercase, lowercase, number, and symbol (!@#$%^&* etc.)'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  phoneNumber: z.string()
    .regex(/^(\+254|0)[17]\d{8}$/, 'Invalid Kenyan phone number. Must be 10 digits starting with 07 or 01 (e.g., 0712345678, 0112345678)'),
  role: z.enum(['PUBLIC', 'LAWYER']),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});


export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(10, 'New password must be at least 10 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>_\-+=])/, 'Password must contain uppercase, lowercase, number, and symbol (!@#$%^&* etc.)'),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

// Infer types from schemas
import { ResetPasswordSchema } from './forgotPassword';
export type LoginRequest = z.infer<typeof LoginSchema>;
export type RegisterRequest = z.infer<typeof RegisterSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenSchema>;
export type ResetPasswordRequest = z.infer<typeof ResetPasswordSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordSchema>;
export type VerifyEmailRequest = z.infer<typeof VerifyEmailSchema>;