import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuthenticatedRequest } from '../middleware/auth';
import type { ApiResponse, UserRole } from '@wakili-pro/shared';
import { UpdateUserProfileSchema, LawyerOnboardingSchema } from '@wakili-pro/shared';

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
        verificationStatus: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            emailNotifications: true,
            smsNotifications: true,
            pushNotifications: true,
            consultationReminders: true,
            profileVisibility: true,
            showActivityStatus: true,
            dataAnalytics: true,
          }
        },
        lawyerProfile: {
          select: {
            id: true,
            licenseNumber: true,
            specializations: true,
            location: true,
            isVerified: true,
            rating: true,
            reviewCount: true
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

    // If email is being changed, check if it's already in use by another user
    if (userUpdateData.email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: userUpdateData.email,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        res.status(400).json({
          success: false,
          message: 'Email address is already in use by another account'
        });
        return;
      }

      // If email is being changed, set emailVerified to false
      userUpdateData.emailVerified = false;
    }

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
    const userRole = req.user?.role as UserRole | undefined;

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



    // Create lawyer profile
    const lawyerProfile = await prisma.lawyerProfile.create({
      data: {
        userId,
        providerId: userId, // Set providerId same as userId
        licenseNumber: onboardingData.licenseNumber,
        yearOfAdmission: onboardingData.yearOfAdmission,
        bio: onboardingData.bio,
        yearsOfExperience: onboardingData.yearsOfExperience,
        profileImageUrl: onboardingData.profileImageUrl,
        linkedInProfile: onboardingData.linkedInProfile,
        hourlyRate: onboardingData.hourlyRate,
        offPeakHourlyRate: onboardingData.offPeakHourlyRate,
        available24_7: onboardingData.available24_7 || false,
        workingHours: onboardingData.workingHours 
          ? JSON.stringify(onboardingData.workingHours)
          : null,
        specializations: Array.isArray(onboardingData.specializations)
          ? onboardingData.specializations.map((s: any) =>
              typeof s === 'string'
                ? s
                : (s.id ? String(s.id) : s.name ? String(s.name) : '')
            ).filter((s: string) => !!s)
          : [],
        location: typeof onboardingData.location === 'string'
          ? onboardingData.location
          : onboardingData.location && typeof onboardingData.location === 'object'
            ? JSON.stringify(onboardingData.location)
            : '',
        isVerified: false, // Pending admin approval
        rating: 0,
        reviewCount: 0,
        tier: 'FREE' // Start with free tier
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
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

export const updateNotificationPreferences = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { email, sms, push, consultationReminders } = req.body;

    // Map frontend keys to database field names
    const updateData: any = {};
    if (email !== undefined) updateData.emailNotifications = email;
    if (sms !== undefined) updateData.smsNotifications = sms;
    if (push !== undefined) updateData.pushNotifications = push;
    if (consultationReminders !== undefined) updateData.consultationReminders = consultationReminders;

    // Update or create user profile with notification preferences
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
      select: {
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        consultationReminders: true,
      }
    });

    const response: ApiResponse<typeof profile> = {
      success: true,
      message: 'Notification preferences updated successfully',
      data: profile
    };

    res.json(response);
  } catch (error) {
    console.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating notification preferences'
    });
  }
};

export const updatePrivacySettings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const { profileVisibility, showActivityStatus, dataAnalytics } = req.body;

    // Build update data object
    const updateData: any = {};
    if (profileVisibility !== undefined) updateData.profileVisibility = profileVisibility;
    if (showActivityStatus !== undefined) updateData.showActivityStatus = showActivityStatus;
    if (dataAnalytics !== undefined) updateData.dataAnalytics = dataAnalytics;

    // Update or create user profile with privacy settings
    const profile = await prisma.userProfile.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData,
      },
      select: {
        profileVisibility: true,
        showActivityStatus: true,
        dataAnalytics: true,
      }
    });

    const response: ApiResponse<typeof profile> = {
      success: true,
      message: 'Privacy settings updated successfully',
      data: profile
    };

    res.json(response);
  } catch (error) {
    console.error('Update privacy settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating privacy settings'
    });
  }
};