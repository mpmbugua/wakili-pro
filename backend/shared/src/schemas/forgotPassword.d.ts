import { z } from 'zod';
export declare const ForgotPasswordSchema: z.ZodObject<{
    email: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email?: string;
}, {
    email?: string;
}>;
export declare const ResetPasswordSchema: z.ZodObject<{
    token: z.ZodString;
    newPassword: z.ZodString;
}, "strip", z.ZodTypeAny, {
    token?: string;
    newPassword?: string;
}, {
    token?: string;
    newPassword?: string;
}>;
//# sourceMappingURL=forgotPassword.d.ts.map