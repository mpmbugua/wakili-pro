export interface LoginRequest {
  identifier: string; // Email or phone number
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'PUBLIC' | 'LAWYER';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    verificationStatus: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'PUBLIC' | 'LAWYER' | 'ADMIN';
  firstName: string;
  lastName: string;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
}