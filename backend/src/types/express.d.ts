import { Request } from 'express';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  // Add other user fields as needed
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}
