import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ApiResponse } from '@wakili-pro/shared';
import { z } from 'zod';
import {
  createConsultationBooking,
  getBookingById,
  getUserBookings,
  confirmSessionCompletion,
  cancelBooking,
  rescheduleBooking,
  confirmBookingPayment,
} from '../services/consultationBookingService';
import { ConsultationType } from '@prisma/client';
import { mpesaService } from '../services/mpesaDarajaService';

// Validation schemas
const CreateBookingSchema = z.object({
  lawyerId: z.string().min(1, 'Lawyer ID is required'),
  consultationType: z.enum(['VIDEO', 'PHONE', 'IN_PERSON']),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  phoneNumber: z.string().regex(/^(\+254|254|0)[17]\d{8}$/, 'Invalid Kenyan phone number'),
});

const ConfirmSessionSchema = z.object({
  confirmedBy: z.enum(['CLIENT', 'LAWYER']),
});

const CancelBookingSchema = z.object({
  reason: z.string().optional(),
});

const RescheduleBookingSchema = z.object({
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
});

/**
 * Create a new consultation booking
 * @route POST /api/consultations/create
 */
export const createBooking = async (
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
    const validation = CreateBookingSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const { lawyerId, consultationType, scheduledStart, scheduledEnd, phoneNumber } =
      validation.data;

    // Create booking
    const booking = await createConsultationBooking({
      clientId: userId,
      lawyerId,
      consultationType: consultationType as ConsultationType,
      scheduledStart: new Date(scheduledStart),
      scheduledEnd: new Date(scheduledEnd),
      phoneNumber,
    });

    // Initiate M-Pesa payment
    const mpesaResponse = await mpesaService.initiateSTKPush({
      phoneNumber,
      amount: Number(booking.clientPaymentAmount),
      accountReference: `CONSULT-${booking.id}`,
      transactionDesc: `Consultation with ${booking.lawyer.firstName} ${booking.lawyer.lastName}`,
    });

    const response: ApiResponse<any> = {
      success: true,
      message: 'Booking created successfully. Please complete M-Pesa payment.',
      data: {
        ...booking,
        payment: {
          checkoutRequestID: mpesaResponse.CheckoutRequestID,
          merchantRequestID: mpesaResponse.MerchantRequestID,
        },
      },
    };

    res.status(201).json(response);
  } catch (error: any) {
    console.error('Create booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create booking',
    });
  }
};

/**
 * Get booking details by ID
 * @route GET /api/consultations/:id
 */
export const getBooking = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const booking = await getBookingById(id, userId);

    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    const response: ApiResponse<typeof booking> = {
      success: true,
      message: 'Booking retrieved successfully',
      data: booking,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get booking',
    });
  }
};

/**
 * Get all bookings for current user
 * @route GET /api/consultations/my-bookings
 */
export const getMyBookings = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    const { status, upcoming } = req.query;

    const bookings = await getUserBookings(userId, userRole as 'CLIENT' | 'LAWYER', {
      status: status as any,
      upcoming: upcoming === 'true',
    });

    const response: ApiResponse<typeof bookings> = {
      success: true,
      message: 'Bookings retrieved successfully',
      data: bookings,
    };

    res.status(200).json(response);
  } catch (error: any) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get bookings',
    });
  }
};

/**
 * Confirm session completion
 * @route PATCH /api/consultations/:id/confirm
 */
export const confirmSession = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Validate request body
    const validation = ConfirmSessionSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const { confirmedBy } = validation.data;

    // Verify booking belongs to user
    const booking = await getBookingById(id, userId);
    if (!booking) {
      res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
      return;
    }

    // Confirm with dual-confirmation logic
    const result = await confirmSessionCompletion(id, userId, confirmedBy);

    let message = `${confirmedBy === 'CLIENT' ? 'Client' : 'Lawyer'} confirmation recorded`;
    if (result.bothConfirmed) {
      message = 'Session completed - both parties confirmed';
      if (result.payoutReleased) {
        message += ' and payment released to lawyer';
      }
    } else {
      message += `. Waiting for ${confirmedBy === 'CLIENT' ? 'lawyer' : 'client'} confirmation`;
    }

    res.status(200).json({
      success: true,
      message,
      data: {
        bothConfirmed: result.bothConfirmed,
        payoutReleased: result.payoutReleased,
      },
    });
  } catch (error: any) {
    console.error('Confirm session error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm session',
    });
  }
};

/**
 * Cancel a booking
 * @route PATCH /api/consultations/:id/cancel
 */
export const cancelBookingEndpoint = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Validate request body
    const validation = CancelBookingSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const { reason } = validation.data;

    await cancelBooking(id, userId, reason);

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error: any) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to cancel booking',
    });
  }
};

/**
 * Reschedule a booking
 * @route PATCH /api/consultations/:id/reschedule
 */
export const rescheduleBookingEndpoint = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
      return;
    }

    // Validate request body
    const validation = RescheduleBookingSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.error.issues,
      });
      return;
    }

    const { scheduledStart, scheduledEnd } = validation.data;

    await rescheduleBooking(
      id,
      new Date(scheduledStart),
      new Date(scheduledEnd),
      userId
    );

    res.status(200).json({
      success: true,
      message: 'Booking rescheduled successfully',
    });
  } catch (error: any) {
    console.error('Reschedule booking error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reschedule booking',
    });
  }
};

/**
 * Confirm booking payment (called by M-Pesa callback)
 * @route POST /api/consultations/:id/payment-confirm
 */
export const confirmPayment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { paymentId } = req.body;

    if (!paymentId) {
      res.status(400).json({
        success: false,
        message: 'Payment ID is required',
      });
      return;
    }

    await confirmBookingPayment(id, paymentId);

    res.status(200).json({
      success: true,
      message: 'Payment confirmed successfully',
    });
  } catch (error: any) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to confirm payment',
    });
  }
};
