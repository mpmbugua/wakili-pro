export type TwoFAMethod = 'TOTP' | 'EMAIL' | 'SMS';

export interface UserSecurity {
  twoFAEnabled: boolean;
  twoFAMethod?: TwoFAMethod;
  twoFASecret?: string; // For TOTP
  twoFAVerified?: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
}
