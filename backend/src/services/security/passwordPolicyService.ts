// PasswordPolicy type is not in shared package, so define locally
type PasswordPolicy = {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSymbol: boolean;
};

// Example strong policy
export const defaultPasswordPolicy: PasswordPolicy = {
  minLength: 10,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSymbol: true,
};

export function validatePassword(password: string, policy: PasswordPolicy = defaultPasswordPolicy): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < policy.minLength) errors.push(`Password must be at least ${policy.minLength} characters.`);
  if (policy.requireUppercase && !/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter.');
  if (policy.requireLowercase && !/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter.');
  if (policy.requireNumber && !/[0-9]/.test(password)) errors.push('Password must contain a number.');
  if (policy.requireSymbol && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Password must contain a symbol.');
  return { valid: errors.length === 0, errors };
}
