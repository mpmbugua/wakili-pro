import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import type { ApiResponse, UserRole } from '@wakili-pro/shared';
import { LawyerOnboardingSchema, UpdateAvailabilitySchema } from '@wakili-pro/shared';
import { uploadProfilePhoto as uploadToCloudinary, isValidImageType } from '../services/fileUploadService';

const prisma = new PrismaClient();

export const getLawyerProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            // profilePicture: true // TODO: Add to User model,
            emailVerified: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    });

    if (!lawyerProfile) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found'
      });
      return;
    }

    const response: ApiResponse<typeof lawyerProfile> = {
      success: true,
      message: 'Lawyer profile retrieved successfully',
      data: lawyerProfile
    };

    res.json(response);
  } catch (error) {
    console.error('Get lawyer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching lawyer profile'
    });
  }
};

export const updateLawyerProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        message: 'Only lawyers can update lawyer profiles'
      });
      return;
    }

    // Check if lawyer profile exists
    const existingProfile = await prisma.lawyerProfile.findUnique({
      where: { userId }
    });

    if (!existingProfile) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found. Please complete onboarding first.'
      });
      return;
    }

    const validationResult = LawyerOnboardingSchema.partial().safeParse(req.body);
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

    const updateData = validationResult.data;

    // Check if license number is being updated and ensure it's unique
    if (updateData.licenseNumber && updateData.licenseNumber !== existingProfile.licenseNumber) {
      // Prisma's unique input for findUnique is either id or userId, not licenseNumber directly
      const existingLicense = await prisma.lawyerProfile.findFirst({
        where: { licenseNumber: updateData.licenseNumber }
      });
      if (existingLicense) {
        res.status(409).json({
          success: false,
          message: 'License number already registered'
        });
        return;
      }
    }

    // Update lawyer profile
    const updatePayload: any = {};
    if (updateData.specializations) {
      // If specializations is array of objects, map to string[]
      if (Array.isArray(updateData.specializations) && typeof updateData.specializations[0] === 'object') {
        updatePayload.specializations = updateData.specializations.map((s: any) => s.name);
      } else {
        updatePayload.specializations = updateData.specializations;
      }
    }
    if (updateData.location) {
      // If location is an object, stringify or pick a string property
      if (typeof updateData.location === 'object' && updateData.location !== null) {
        updatePayload.location = JSON.stringify(updateData.location);
      } else {
        updatePayload.location = updateData.location;
      }
    }
    if (updateData.licenseNumber) updatePayload.licenseNumber = updateData.licenseNumber;
    if (updateData.yearOfAdmission) updatePayload.yearOfAdmission = updateData.yearOfAdmission;
    if ('tier' in updateData && updateData.tier) updatePayload.tier = updateData.tier;
    if ('phoneNumber' in updateData && updateData.phoneNumber) updatePayload.phoneNumber = updateData.phoneNumber;

    const updatedProfile = await prisma.lawyerProfile.update({
      where: { userId },
      data: updatePayload,
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

    const response: ApiResponse<typeof updatedProfile> = {
      success: true,
      message: 'Lawyer profile updated successfully',
      data: updatedProfile
    };

    res.json(response);
  } catch (error) {
    console.error('Update lawyer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating lawyer profile'
    });
  }
};

export const updateAvailability = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        message: 'Only lawyers can update availability'
      });
      return;
    }

    const validationResult = UpdateAvailabilitySchema.safeParse(req.body);
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

    const { availability } = validationResult.data;

    // Availability is not a field in LawyerProfile; respond with error or ignore
    res.status(400).json({
      success: false,
      message: 'Availability is not supported in the current schema.'
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while updating availability'
    });
  }
};
import { Request } from 'express';
export const getPublicLawyerProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { lawyerId } = req.params;

    if (!lawyerId) {
      res.status(400).json({
        success: false,
        message: 'Lawyer ID is required'
      });
      return;
    }

    // Try to find by LawyerProfile.id first, then by userId
    let lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            profileImageUrl: true,
            createdAt: true
          }
        }
      }
    });

    // If not found by profile id, try by user id
    if (!lawyerProfile) {
      lawyerProfile = await prisma.lawyerProfile.findUnique({
        where: { userId: lawyerId },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              profileImageUrl: true,
              createdAt: true
            }
          }
        }
      });
    }

    if (!lawyerProfile) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found'
      });
      return;
    }

    // Parse location if it's stored as JSON string
    let locationDetails = null;
    if (lawyerProfile.location) {
      try {
        locationDetails = typeof lawyerProfile.location === 'string' 
          ? JSON.parse(lawyerProfile.location) 
          : lawyerProfile.location;
      } catch (e) {
        // If parsing fails, treat as plain string
        locationDetails = { city: lawyerProfile.location };
      }
    }

    // Build response with all public information
    const publicProfile = {
      id: lawyerProfile.id,
      userId: lawyerProfile.userId,
      user: lawyerProfile.user,
      licenseNumber: lawyerProfile.licenseNumber,
      yearOfAdmission: lawyerProfile.yearOfAdmission,
      specializations: lawyerProfile.specializations,
      location: lawyerProfile.location,
      locationDetails,
      bio: lawyerProfile.bio,
      yearsOfExperience: lawyerProfile.yearsOfExperience,
      rating: lawyerProfile.rating,
      reviewCount: lawyerProfile.reviewCount,
      isVerified: lawyerProfile.isVerified,
      tier: lawyerProfile.tier,
      linkedInProfile: lawyerProfile.linkedInProfile,
      profileImageUrl: lawyerProfile.profileImageUrl,
      hourlyRate: lawyerProfile.hourlyRate,
      isAvailable: true // Could be determined by checking availability schedule
    };

    const response: ApiResponse<typeof publicProfile> = {
      success: true,
      message: 'Lawyer profile retrieved successfully',
      data: publicProfile
    };

    res.json(response);
  } catch (error) {
    console.error('Get public lawyer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching lawyer profile'
    });
  }
};
export const searchLawyers = async (req: Request, res: Response): Promise<void> => {
  try {

    // Safely extract and cast query params
    const specializationRaw = req.query.specialization;
    const minRatingRaw = req.query.minRating;
    const pageRaw = req.query.page;
    const limitRaw = req.query.limit;

    const getString = (val: unknown): string | undefined => {
      if (typeof val === 'string') return val;
      if (Array.isArray(val) && typeof val[0] === 'string') return val[0];
      return undefined;
    };

    const getNumber = (val: unknown, fallback: number): number => {
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const n = Number(val);
        return isNaN(n) ? fallback : n;
      }
      if (Array.isArray(val) && typeof val[0] === 'string') {
        const n = Number(val[0]);
        return isNaN(n) ? fallback : n;
      }
      return fallback;
    };

    const specialization = getString(specializationRaw);
    const minRating = getNumber(minRatingRaw, 0);
    const page = getNumber(pageRaw, 1);
    const limit = getNumber(limitRaw, 10);

    const skip = (page - 1) * limit;

    // Build where clause
  const where: Record<string, unknown> = {
      isVerified: true
    };


    if (specialization) {
      where.specializations = { has: specialization };
    }

    if (minRating) {
      where.rating = {
        gte: minRating
      };
    }

    // Get lawyers with basic filtering
    const lawyers = await prisma.lawyerProfile.findMany({
      where,
      select: {
        id: true,
        userId: true,
        licenseNumber: true,
        isVerified: true,
        specializations: true,
        experience: true,
        rating: true,
        reviewCount: true,
        hourlyRate: true,
        // allowsFirstConsultDiscount: true, // Field doesn't exist in production
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            profileImageUrl: true
          }
        }
      },
      skip,
      take: limit,
      orderBy: [
        { rating: 'desc' },
        { reviewCount: 'desc' }
      ]
    });

    // Get total count
    const total = await prisma.lawyerProfile.count({ where });


    const response: ApiResponse<{
      lawyers: typeof lawyers;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
      };
    }> = {
      success: true,
      message: 'Lawyers retrieved successfully',
      data: {
        lawyers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Search lawyers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while searching lawyers'
    });
  }
};

/**
 * Upload lawyer profile photo
 */
export const uploadProfilePhoto = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
        message: 'Only lawyers can upload profile photos'
      });
      return;
    }

    // Check if file was uploaded
    const file = req.file;
    if (!file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    // Validate image type
    if (!isValidImageType(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, GIF, WebP, and SVG images are allowed.'
      });
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 5MB.'
      });
      return;
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      file.buffer,
      file.originalname,
      userId
    );

    // Update lawyer profile with Cloudinary URL
    const updatedProfile = await prisma.lawyerProfile.update({
      where: { userId },
      data: { profileImageUrl: uploadResult.url },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        profileImageUrl: uploadResult.url,
        publicId: uploadResult.publicId,
        fileSize: uploadResult.fileSize,
        profile: updatedProfile
      }
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while uploading profile photo'
    });
  }
};