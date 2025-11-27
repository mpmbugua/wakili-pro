import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../../middleware/auth';
import type { ApiResponse } from '@wakili-pro/shared';

const prisma = new PrismaClient();

/**
 * Get admin dashboard statistics
 */
export const getAdminStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Get total users count
    const totalUsers = await prisma.user.count();
    
    // Get total lawyers count
    const totalLawyers = await prisma.lawyerProfile.count();
    
    // Get pending lawyer applications
    const pendingApplications = await prisma.lawyerProfile.count({
      where: { isVerified: false }
    });
    
    // Get verified lawyers count
    const verifiedLawyers = await prisma.lawyerProfile.count({
      where: { isVerified: true }
    });

    const stats = {
      totalUsers,
      totalLawyers,
      verifiedLawyers,
      pendingApplications,
      activeUsers: totalUsers, // Can be refined with last login tracking
      consultationsToday: 0, // TODO: Implement when consultations are tracked
      platformRevenue: 0, // TODO: Implement when payments are tracked
      flaggedContent: 0, // TODO: Implement content moderation
      activeIssues: 0 // TODO: Implement issue tracking
    };

    const response: ApiResponse<typeof stats> = {
      success: true,
      message: 'Admin statistics retrieved successfully',
      data: stats
    };

    res.json(response);
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin statistics'
    });
  }
};

/**
 * Get all pending lawyer applications
 */
export const getPendingLawyers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const pendingLawyers = await prisma.lawyerProfile.findMany({
      where: {
        isVerified: false
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            profileImageUrl: true,
            createdAt: true,
            verificationStatus: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const response: ApiResponse<typeof pendingLawyers> = {
      success: true,
      message: 'Pending lawyers retrieved successfully',
      data: pendingLawyers
    };

    res.json(response);
  } catch (error) {
    console.error('Get pending lawyers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending lawyers'
    });
  }
};

/**
 * Get all verified lawyers
 */
export const getVerifiedLawyers = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const verifiedLawyers = await prisma.lawyerProfile.findMany({
      where: {
        isVerified: true
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            profileImageUrl: true,
            createdAt: true,
            verificationStatus: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const response: ApiResponse<typeof verifiedLawyers> = {
      success: true,
      message: 'Verified lawyers retrieved successfully',
      data: verifiedLawyers
    };

    res.json(response);
  } catch (error) {
    console.error('Get verified lawyers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve verified lawyers'
    });
  }
};

/**
 * Approve a lawyer application
 */
export const approveLawyer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { lawyerId } = req.params;

    if (!lawyerId) {
      res.status(400).json({
        success: false,
        message: 'Lawyer ID is required'
      });
      return;
    }

    // Find the lawyer profile
    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      include: { user: true }
    });

    if (!lawyerProfile) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found'
      });
      return;
    }

    // Update lawyer profile and user verification status
    const updatedProfile = await prisma.lawyerProfile.update({
      where: { id: lawyerId },
      data: {
        isVerified: true,
        user: {
          update: {
            verificationStatus: 'VERIFIED'
          }
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            profileImageUrl: true,
            verificationStatus: true
          }
        }
      }
    });

    const response: ApiResponse<typeof updatedProfile> = {
      success: true,
      message: 'Lawyer approved successfully',
      data: updatedProfile
    };

    res.json(response);
  } catch (error) {
    console.error('Approve lawyer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve lawyer'
    });
  }
};

/**
 * Reject a lawyer application
 */
export const rejectLawyer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { lawyerId } = req.params;
    const { reason } = req.body;

    if (!lawyerId) {
      res.status(400).json({
        success: false,
        message: 'Lawyer ID is required'
      });
      return;
    }

    // Find the lawyer profile
    const lawyerProfile = await prisma.lawyerProfile.findUnique({
      where: { id: lawyerId },
      include: { user: true }
    });

    if (!lawyerProfile) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found'
      });
      return;
    }

    // Update user verification status
    await prisma.user.update({
      where: { id: lawyerProfile.userId },
      data: {
        verificationStatus: 'REJECTED'
      }
    });

    const response: ApiResponse<null> = {
      success: true,
      message: 'Lawyer application rejected',
      data: null
    };

    res.json(response);
  } catch (error) {
    console.error('Reject lawyer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject lawyer application'
    });
  }
};
