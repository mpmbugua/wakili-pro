"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyEmailSchema = exports.ChangePasswordSchema = exports.ResetPasswordSchema = exports.RefreshTokenSchema = exports.RegisterSchema = exports.LoginSchema = void 0;
const zod_1 = require("zod");
exports.LoginSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.RegisterSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
    password: zod_1.z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters').max(50),
    lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters').max(50),
    phoneNumber: zod_1.z.string()
        .regex(/^(\+254|0)[17]\d{8}$/, 'Invalid Kenyan phone number format')
        .optional(),
    role: zod_1.z.enum(['PUBLIC', 'LAWYER']),
});
exports.RefreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.ResetPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email('Invalid email format'),
});
exports.ChangePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string().min(1, 'Current password is required'),
    newPassword: zod_1.z.string()
        .min(8, 'New password must be at least 8 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
});
exports.VerifyEmailSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, 'Verification token is required'),
});
