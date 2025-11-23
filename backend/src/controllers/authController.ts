import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyRefreshToken,
  AuthenticatedRequest,
  JWTPayload
} from '../middleware/auth';
import type { ApiResponse, UserRole } from '@wakili-pro/shared';
import { LoginSchema, RegisterSchema, RefreshTokenSchema, ChangePasswordSchema } from '@wakili-pro/shared';
import { validatePassword } from '../services/security/passwordPolicyService';
import { 
  verifyGoogleToken, 
  verifyFacebookToken, 
  findOrCreateGoogleUser, 
  findOrCreateFacebookUser 
} from '../services/oauthService';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validationResult = RegisterSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }

    const { email, password, firstName, lastName, phoneNumber, role } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Password policy validation
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordCheck.errors.map(message => ({ field: 'password', message }))
      });
      return;
    }
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phoneNumber,
        role,
        emailVerified: false
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        phoneNumber: true,
        createdAt: true
      }
    });

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token (in production, consider using Redis)
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    const response: ApiResponse<{
      user: typeof user;
      accessToken: string;
      refreshToken: string;
    }> = {
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        accessToken,
        refreshToken
      }
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body
    const validationResult = LoginSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }

    const { email, password } = validationResult.data;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        phoneNumber: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
      return;
    }

    // Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    const response: ApiResponse<{
      user: typeof userWithoutPassword;
      accessToken: string;
      refreshToken: string;
    }> = {
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        accessToken,
        refreshToken
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = RefreshTokenSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }

    const { refreshToken: token } = validationResult.data;

    // Verify refresh token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: { token },
    });
    if (!storedToken) {
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
      return;
    }

    // Verify JWT
    try {
      const decoded = verifyRefreshToken(token);

      if (storedToken.userId !== decoded.userId) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
        return;
      }

      // Get user for payload
      const user = await prisma.user.findUnique({ where: { id: storedToken.userId } });
      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
        return;
      }

      // Generate new tokens
      const tokenPayload: JWTPayload = {
        userId: user.id,
        email: user.email,
        role: user.role as UserRole
      };

      const newAccessToken = generateAccessToken(tokenPayload);
      const newRefreshToken = generateRefreshToken(tokenPayload);

      // Update refresh token in database
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          token: newRefreshToken
        }
      });

      const response: ApiResponse<{
        accessToken: string;
        refreshToken: string;
      }> = {
        success: true,
        message: 'Tokens refreshed successfully',
        data: {
          accessToken: newAccessToken,
          refreshToken: newRefreshToken
        }
      };

      res.json(response);
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token'
      });
      return;
    }
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during token refresh'
    });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete refresh token from database
      await prisma.refreshToken.deleteMany({
        where: { 
          token: refreshToken,
          userId: req.user?.id 
        }
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout'
    });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = ChangePasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }

    const { currentPassword, newPassword } = validationResult.data;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
      return;
    }

    // Password policy validation
    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) {
      res.status(400).json({
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordCheck.errors.map(message => ({ field: 'newPassword', message }))
      });
      return;
    }
    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    // Invalidate all refresh tokens for security
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in again.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during password change'
    });
  }
};

import { ForgotPasswordSchema, ResetPasswordSchema } from '@wakili-pro/shared';
import crypto from 'crypto';

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = ForgotPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.issues.map((issue: import('zod').ZodIssue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }

    const { email } = validationResult.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token in DB (add passwordResetToken/passwordResetExpires fields to user model if not present)
    await prisma.user.update({
      where: { email },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: expiresAt
      }
    });

    // TODO: Send email with resetToken (implement email sending logic)

    res.json({ success: true, message: 'Password reset link sent to email.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during forgot password' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validationResult = ResetPasswordSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationResult.error.issues.map((issue: import('zod').ZodIssue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }

    const { token, newPassword } = validationResult.data;
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() }
      }
    });
    if (!user) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
      return;
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedNewPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Internal server error during password reset' });
  }
};

/**
 * Google OAuth Login
 * POST /api/auth/google
 */
export const googleOAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      res.status(400).json({
        success: false,
        message: 'Google ID token is required',
      });
      return;
    }
    
    // Verify token with Google
    const payload = await verifyGoogleToken(idToken);
    
    // Find or create user
    const user = await findOrCreateGoogleUser(payload);
    
    // Generate JWT tokens
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    
    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
    });
    
    res.status(200).json({
      success: true,
      message: 'Google login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          profile: user.profile,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error('Google OAuth error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Google authentication failed',
    });
  }
};

/**
 * Facebook OAuth Login
 * POST /api/auth/facebook
 */
export const facebookOAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { accessToken } = req.body;
    
    if (!accessToken) {
      res.status(400).json({
        success: false,
        message: 'Facebook access token is required',
      });
      return;
    }
    
    // Verify token with Facebook
    const fbData = await verifyFacebookToken(accessToken);
    
    // Find or create user
    const user = await findOrCreateFacebookUser(fbData);
    
    // Generate JWT tokens
    const tokenPayload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    };
    
    const jwtAccessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    
    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      },
    });
    
    res.status(200).json({
      success: true,
      message: 'Facebook login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          emailVerified: user.emailVerified,
          profile: user.profile,
        },
        accessToken: jwtAccessToken,
        refreshToken,
      },
    });
  } catch (error: any) {
    console.error('Facebook OAuth error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Facebook authentication failed',
    });
  }
};
