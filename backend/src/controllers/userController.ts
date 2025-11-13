import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth';
import { UpdateUserProfileSchema, LawyerOnboardingSchema, ApiResponse } from '@wakili-pro/shared';

const prisma = new PrismaClient();

export const getProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        emailVerified: true,
        // profilePicture: true // TODO: Add to User model,
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
        lawyerProfile: {
          select: {
            id: true,
            licenseNumber: true,
            specializations: true,
            yearsOfExperience: true,
            location: true,
            bio: true,
            isVerified: true,
            rating: true,
            reviewCount: true,
            availability: true
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const response: ApiResponse<typeof user> = {
      success: true,
      message: 'Profile retrieved successfully',
      data: user
    };

    res.json(response);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching profile'
    });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const validationResult = UpdateUserProfileSchema.safeParse(req.body);
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

    const { profile, ...userUpdateData } = validationResult.data;

    // Update user fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        // profilePicture: true // TODO: Add to User model,
        emailVerified: true,
        updatedAt: true
      }
    });

    // Update profile if provided
    if (profile) {
      await prisma.userProfile.upsert({
        where: { userId },
        update: profile,
        create: { userId, ...profile }
      });
    }

    const response: ApiResponse<typeof updatedUser> = {
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    };

    res.json(response);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating profile'
    });
  }
};

export const lawyerOnboarding = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (userRole !== 'LAWYER') {
      res.status(403).json({
        success: false,
        message: 'Only lawyers can complete lawyer onboarding'
      });
      return;
    }

    const validationResult = LawyerOnboardingSchema.safeParse(req.body);
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

    const onboardingData = validationResult.data;

    // Check if lawyer profile already exists
    const existingProfile = await prisma.lawyerProfile.findUnique({
      where: { userId }
    });

    if (existingProfile) {
      res.status(409).json({
        success: false,
        message: 'Lawyer profile already exists. Use update endpoint to modify.'
      });
      return;
    }

    // Check if license number is unique
    const existingLicense = await prisma.lawyerProfile.findUnique({
      where: { licenseNumber: onboardingData.licenseNumber }
    });

    if (existingLicense) {
      res.status(409).json({
        success: false,
        message: 'License number already registered'
      });
      return;
    }

    // Create lawyer profile
    const lawyerProfile = await prisma.lawyerProfile.create({
      data: {
        userId,
        licenseNumber: onboardingData.licenseNumber,
        yearOfAdmission: onboardingData.yearOfAdmission,
        specializations: onboardingData.specializations as any, // Prisma Json type
        location: onboardingData.location as any, // Prisma Json type
        bio: onboardingData.bio,
        yearsOfExperience: onboardingData.yearsOfExperience,
        profileImageUrl: onboardingData.profileImageUrl,
        availability: [], // Default empty availability
        isVerified: false,
        rating: 0,
        reviewCount: 0
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            // profilePicture: true // TODO: Add to User model
          }
        }
      }
    });

    const response: ApiResponse<typeof lawyerProfile> = {
      success: true,
      message: 'Lawyer profile created successfully. Verification pending.',
      data: lawyerProfile
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Lawyer onboarding error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during lawyer onboarding'
    });
  }
};

export const deleteAccount = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { password } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    if (!password) {
      res.status(400).json({
        success: false,
        message: 'Password confirmation required for account deletion'
      });
      return;
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid password'
      });
      return;
    }

    // Soft delete - anonymize email (TODO: add status field to User model)
    await prisma.user.update({
      where: { id: userId },
      data: { 
        email: `deleted_${Date.now()}_${user.password.slice(0, 8)}@deleted.com` // Anonymize email
      }
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({
      where: { userId }
    });

    res.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during account deletion'
    });
  }
};