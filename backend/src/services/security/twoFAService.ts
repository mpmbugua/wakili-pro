import { TwoFAMethod } from '@shared';

// Mock/in-memory store for demo
const user2FA: Record<string, { enabled: boolean; method?: TwoFAMethod; secret?: string; verified?: boolean }> = {};

export const TwoFAService = {
  setup: (userId: string, method: TwoFAMethod) => {
    // In production, generate TOTP secret or send code via email/SMS
    user2FA[userId] = { enabled: false, method, secret: 'mock-secret', verified: false };
    return { method, secret: 'mock-secret' };
  },
  verify: (userId: string, code: string) => {
    // In production, verify TOTP/email/SMS code
    if (code === '123456') {
      user2FA[userId].enabled = true;
      user2FA[userId].verified = true;
      return { success: true };
    }
    return { success: false, message: 'Invalid code' };
  },
  disable: (userId: string) => {
    user2FA[userId] = { enabled: false };
  },
};
