import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';
import type { ApiResponse, UserRole } from '@wakili-pro/shared';
import { LawyerOnboardingSchema, UpdateAvailabilitySchema } from '@wakili-pro/shared';

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
      const existingLicense = await prisma.lawyerProfile.findUnique({
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
    const updatedProfile = await prisma.lawyerProfile.update({
      where: { userId },
      data: {
        ...(updateData.specializations && { specializations: updateData.specializations as Record<string, unknown> }),
        ...(updateData.location && { location: updateData.location as Record<string, unknown> })
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true
            // profilePicture: true // TODO: Add to User model
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

    const updatedProfile = await prisma.lawyerProfile.update({
      where: { userId },
      data: {
        availability: availability as Record<string, unknown> // Prisma Json type
      }
    });

    const response: ApiResponse<{ availability: typeof availability }> = {
            success: true,
            message: 'Availability updated successfully',
            data: {
        availability: updatedProfile.availability as Record<string, unknown>
      }
    };

    res.json(response);
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

    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { userId: lawyerId },
      select: {
        id: true,
        licenseNumber: true,
        yearOfAdmission: true,
        specializations: true,
        location: true,
        rating: true,
        reviewCount: true,
        isVerified: true,
        user: {
          select: {
            firstName: true,
            lastName: true
            // profilePicture: true // TODO: Add to User model
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

    // Only show verified profiles to public
    if (!lawyerProfile.isVerified) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not available'
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
    console.error('Get public lawyer profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching lawyer profile'
    });
  }
};
export const searchLawyers = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      specialization,
      minRating = 0,
      page = 1,
      limit = 10
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
  const where: Record<string, unknown> = {
      isVerified: true
    };

    if (specialization) {
      where.specializations = {
        path: '$[*].name',
        array_contains: specialization
      };
    }

    if (minRating) {
      where.rating = {
        gte: parseFloat(minRating)
      };
    }

    // Get lawyers with basic filtering
    const lawyers = await prisma.lawyerProfile.findMany({
      where,
      select: {
        id: true,
        licenseNumber: true,
        yearOfAdmission: true,
        specializations: true,
        location: true,
        rating: true,
        reviewCount: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
            // profilePicture: true // TODO: Add to User model
          }
        }
      },
      skip,
      take: parseInt(limit),
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
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
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