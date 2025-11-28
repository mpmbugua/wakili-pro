import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '@wakili-pro/shared';
import {
  getAvailableSlots,
  getAvailableSlotsForRange,
  blockTimeSlot,
  unblockTimeSlot,
  getBlockedSlots,
} from '../services/availabilityService';
import { z } from 'zod';

// Validation schemas
const BlockSlotSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  reason: z.string().optional(),
});

const GetSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  duration: z.number().min(15).max(480).optional(), // 15 min to 8 hours
});

const GetSlotsRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  duration: z.number().min(15).max(480).optional(),
});

/**
 * Get available time slots for a lawyer on a specific date
 * @route GET /api/lawyers/:lawyerId/available-slots?date=YYYY-MM-DD&duration=60
 */
export const getLawyerAvailableSlots = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { lawyerId } = req.params;
    const { date, duration } = req.query;

    // Validate query parameters
    const validation = GetSlotsSchema.safeParse({
      date,
      duration: duration ? Number(duration) : 60,
    });

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: validation.error.issues,
      });
      return;
    }

    const { date: dateStr, duration: slotDuration } = validation.data;
    const dateObj = new Date(dateStr);

    // Get available slots
    const slots = await getAvailableSlots(lawyerId, dateObj, slotDuration);

    const response: ApiResponse<typeof slots> = {
      success: true,
      message: 'Available slots retrieved successfully',
      data: slots,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get available slots',
    });
  }
};

/**
 * Get available time slots for a date range (calendar view)
 * @route GET /api/lawyers/:lawyerId/available-slots/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&duration=60
 */
export const getLawyerAvailableSlotsRange = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { lawyerId } = req.params;
    const { startDate, endDate, duration } = req.query;

    // Validate query parameters
    const validation = GetSlotsRangeSchema.safeParse({
      startDate,
      endDate,
      duration: duration ? Number(duration) : 60,
    });

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: validation.error.issues,
      });
      return;
    }

    const { startDate: startDateStr, endDate: endDateStr, duration: slotDuration } = validation.data;
    const startDateObj = new Date(startDateStr);
    const endDateObj = new Date(endDateStr);

    // Validate date range (max 30 days)
    const daysDiff = Math.ceil((endDateObj.getTime() - startDateObj.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) {
      res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 30 days',
      });
      return;
    }

    // Get available slots for range
    const slots = await getAvailableSlotsForRange(lawyerId, startDateObj, endDateObj, slotDuration);

    const response: ApiResponse<typeof slots> = {
      success: true,
      message: 'Available slots range retrieved successfully',
      data: slots,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get available slots range error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get available slots range',
    });
  }
};

/**
 * Block a time slot (lawyer only)
 * @route POST /api/lawyers/availability/block
 */
export const blockSlot = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Validate request body
    const validation = BlockSlotSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        errors: validation.error.issues,
      });
      return;
    }

    const { start, end, reason } = validation.data;

    // Get lawyer profile
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const lawyer = await prisma.lawyerProfile.findUnique({
      where: { userId },
    });

    if (!lawyer) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found',
      });
      return;
    }

    // Validate dates
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
      res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
      return;
    }

    // Block the slot
    await blockTimeSlot(lawyer.id, startDate, endDate, reason);

    res.status(200).json({
      success: true,
      message: 'Time slot blocked successfully',
    });
  } catch (error: any) {
    console.error('Block slot error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to block time slot',
    });
  }
};

/**
 * Unblock a time slot (lawyer only)
 * @route DELETE /api/lawyers/availability/:blockedSlotId
 */
export const unblockSlot = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { blockedSlotId } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Get lawyer profile
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const lawyer = await prisma.lawyerProfile.findUnique({
      where: { userId },
    });

    if (!lawyer) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found',
      });
      return;
    }

    // Unblock the slot
    await unblockTimeSlot(lawyer.id, blockedSlotId);

    res.status(200).json({
      success: true,
      message: 'Time slot unblocked successfully',
    });
  } catch (error: any) {
    console.error('Unblock slot error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to unblock time slot',
    });
  }
};

/**
 * Get all blocked slots for current lawyer
 * @route GET /api/lawyers/availability/blocked
 */
export const getMyBlockedSlots = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Get lawyer profile
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    const lawyer = await prisma.lawyerProfile.findUnique({
      where: { userId },
    });

    if (!lawyer) {
      res.status(404).json({
        success: false,
        message: 'Lawyer profile not found',
      });
      return;
    }

    // Get blocked slots
    const blockedSlots = await getBlockedSlots(lawyer.id);

    const response: ApiResponse<typeof blockedSlots> = {
      success: true,
      message: 'Blocked slots retrieved successfully',
      data: blockedSlots,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get blocked slots error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get blocked slots',
    });
  }
};
