import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { generateAccessToken, generateRefreshToken } from '../middleware/auth';
import { RegisterSchema } from '@wakili-pro/shared';

const prisma = new PrismaClient();

export const simpleRegister = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('[STEP 1] Starting registration');
    console.log('[STEP 1] Body:', JSON.stringify(req.body, null, 2));
    
    // Validate request
    console.log('[STEP 2] Validating with RegisterSchema');
    const validationResult = RegisterSchema.safeParse(req.body);
    if (!validationResult.success) {
      console.log('[STEP 2] Validation FAILED:', validationResult.error);
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
    console.log('[STEP 2] Validation PASSED');

    const { email, password, firstName, lastName, phoneNumber, role } = validationResult.data;
    console.log('[STEP 3] Extracted:', { phoneNumber, email, role, firstName, lastName });

    // Check existing user by phone
    console.log('[STEP 4] Checking existing user by phone:', phoneNumber);
    const existingUserByPhone = await prisma.user.findFirst({
      where: { phoneNumber }
    });
    console.log('[STEP 4] Found by phone?', !!existingUserByPhone);

    if (existingUserByPhone) {
      console.log('[STEP 4] User EXISTS by phone - returning 409');
      res.status(409).json({
        success: false,
        message: 'User with this phone number already exists'
      });
      return;
    }

    // Check existing user by email if provided
    if (email) {
      console.log('[STEP 5] Checking existing user by email:', email);
      const existingUserByEmail = await prisma.user.findUnique({
        where: { email }
      });
      console.log('[STEP 5] Found by email?', !!existingUserByEmail);

      if (existingUserByEmail) {
        console.log('[STEP 5] User EXISTS by email - returning 409');
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }
    }

    // Hash password
    console.log('[STEP 6] Hashing password');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('[STEP 6] Password hashed');

    // Create user
    console.log('[STEP 7] Creating user in database');
    const user = await prisma.user.create({
      data: {
        email: email || `${phoneNumber}@wakili.temp`,
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
    console.log('[STEP 7] User created, ID:', user.id);

    // Generate tokens
    console.log('[STEP 8] Generating access token');
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role as any
    });
    console.log('[STEP 8] Access token generated');

    console.log('[STEP 9] Generating refresh token');
    const refreshToken = generateRefreshToken({
      userId: user.id,
      email: user.email,
      role: user.role as any
    });
    console.log('[STEP 9] Refresh token generated');

    // Store refresh token
    console.log('[STEP 10] Storing refresh token in database');
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });
    console.log('[STEP 10] Refresh token stored');

    console.log('[STEP 11] Sending success response');
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user,
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error('Simple registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error instanceof Error ? error.message : 'Unknown error' 
      })
    });
  }
};
