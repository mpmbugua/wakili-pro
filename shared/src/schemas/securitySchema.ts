import { z } from 'zod';

export const TwoFAMethodSchema = z.enum(['TOTP', 'EMAIL', 'SMS']);

export const UserSecuritySchema = z.object({
  twoFAEnabled: z.boolean(),
  twoFAMethod: TwoFAMethodSchema.optional(),
  twoFASecret: z.string().optional(),
  twoFAVerified: z.boolean().optional(),
});

export const PasswordPolicySchema = z.object({
  minLength: z.number().min(6),
  requireUppercase: z.boolean(),
  requireLowercase: z.boolean(),
  requireNumber: z.boolean(),
  requireSymbol: z.boolean(),
});
