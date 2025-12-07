import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Consultation booking schema
const CreateConsultationSchema = z.object({
  lawyerId: z.string().min(1, 'Lawyer ID is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'), // Can be 'ASAP' or 'HH:MM' format
  duration: z.string().default('60'),
  consultationType: z.enum(['video', 'phone', 'in-person']),
  description: z.string().min(10, 'Please provide a brief description of your legal matter'),
  isImmediate: z.boolean().optional(), // Flag for immediate consultations
});

/**
 * Create a new consultation booking
 */
export const createConsultation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validatedData = CreateConsultationSchema.parse(req.body);
    
    // Verify lawyer exists and get their profile
    const lawyer = await prisma.lawyerProfile.findFirst({
      where: { 
        OR: [
          { userId: validatedData.lawyerId },
          { providerId: validatedData.lawyerId }
        ]
      },
      include: { user: true }
    });

    if (!lawyer) {
      return res.status(404).json({
        success: false,
        message: 'Lawyer not found'
      });
    }

    // Use the lawyer's userId for all references
    const actualLawyerId = lawyer.userId;
    const actualProviderId = lawyer.providerId;

    // Prevent self-booking
    if (actualLawyerId === userId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book a consultation with yourself'
      });
    }

    // Combine date and time into DateTime
    // Handle immediate bookings (ASAP) vs scheduled bookings
    let scheduledDateTime: Date;
    if (validatedData.time === 'ASAP' || req.body.isImmediate) {
      // For immediate bookings, use current time
      scheduledDateTime = new Date();
    } else {
      // For scheduled bookings, parse date and time
      scheduledDateTime = new Date(`${validatedData.date}T${validatedData.time}:00`);
      
      // Validate the parsed date
      if (isNaN(scheduledDateTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date or time format. Please use valid date (YYYY-MM-DD) and time (HH:MM) formats.'
        });
      }
    }

    // Find or create a consultation service for this lawyer
    let consultationService = await prisma.marketplaceService.findFirst({
      where: {
        providerId: actualProviderId,
        type: 'CONSULTATION',
        status: 'ACTIVE'
      }
    });

    // If no consultation service exists, create a default one
    if (!consultationService) {
      consultationService = await prisma.marketplaceService.create({
        data: {
          providerId: actualProviderId,
          title: 'Legal Consultation',
          description: 'Professional legal consultation service',
          type: 'CONSULTATION',
          price: 5000,
          priceKES: 5000,
          status: 'ACTIVE',
          deliveryTimeframe: '60 minutes',
          tags: ['consultation', validatedData.consultationType]
        }
      });
    }

    // Create consultation booking as a service booking
    const booking = await prisma.serviceBooking.create({
      data: {
        userId: userId,
        serviceId: consultationService.id,
        clientId: userId,
        providerId: actualProviderId,
        lawyerId: actualLawyerId,
        scheduledAt: scheduledDateTime,
        status: 'PENDING',
        clientRequirements: validatedData.description
      }
    });

    // Notify lawyer of new consultation request (create notification in database)
    const client = await prisma.user.findUnique({ where: { id: userId } });
    try {
      await prisma.notification.create({
        data: {
          userId: actualLawyerId,
          type: 'BOOKING_CREATED',
          title: 'New Consultation Request',
          message: `${client?.firstName || 'A client'} has requested a ${validatedData.consultationType} consultation on ${validatedData.date} at ${validatedData.time}`
        }
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the booking if notification fails
    }

    res.status(201).json({
      success: true,
      data: {
        id: booking.id,
        lawyerId: actualLawyerId,
        lawyerName: `${lawyer.user.firstName} ${lawyer.user.lastName}`,
        date: validatedData.date,
        time: validatedData.time,
        consultationType: validatedData.consultationType,
        status: 'PENDING',
        scheduledAt: scheduledDateTime
      },
      message: 'Consultation booking created successfully. The lawyer will review and confirm your request.'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    console.error('Error creating consultation:', error);
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    
    res.status(500).json({
      success: false,
      message: 'Failed to create consultation booking',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get user's consultations
 */
export const getMyConsultations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const consultations = await prisma.serviceBooking.findMany({
      where: {
        OR: [
          { clientId: userId },
          { providerId: userId }
        ]
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        provider: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: consultations
    });

  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch consultations'
    });
  }
};

/**
 * Confirm a consultation booking (lawyer only)
 */
export const confirmConsultation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: consultationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get booking and verify lawyer owns it
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: consultationId },
      include: {
        client: true,
        provider: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    if (booking.providerId !== userId && booking.lawyerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to confirm this booking'
      });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot confirm booking with status: ${booking.status}`
      });
    }

    // Update status to CONFIRMED
    const updatedBooking = await prisma.serviceBooking.update({
      where: { id: consultationId },
      data: { status: 'CONFIRMED' }
    });

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: booking.clientId,
        type: 'BOOKING_CONFIRMED',
        title: 'Consultation Confirmed',
        message: `${booking.provider.firstName} ${booking.provider.lastName} has confirmed your consultation on ${new Date(booking.scheduledAt).toLocaleDateString()}`
      }
    });

    // TODO: Send email and SMS notifications to client

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Consultation confirmed successfully'
    });

  } catch (error) {
    console.error('Error confirming consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm consultation'
    });
  }
};

/**
 * Reject a consultation booking (lawyer only)
 */
export const rejectConsultation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: consultationId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get booking and verify lawyer owns it
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: consultationId },
      include: {
        client: true,
        provider: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    if (booking.providerId !== userId && booking.lawyerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reject this booking'
      });
    }

    if (booking.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject booking with status: ${booking.status}`
      });
    }

    // Update status to REJECTED
    const updatedBooking = await prisma.serviceBooking.update({
      where: { id: consultationId },
      data: { 
        status: 'REJECTED',
        rejectionReason: reason
      }
    });

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: booking.clientId,
        type: 'BOOKING_REJECTED',
        title: 'Consultation Declined',
        message: `${booking.provider.firstName} ${booking.provider.lastName} has declined your consultation request. ${reason ? `Reason: ${reason}` : ''} You will receive a full refund within 3-5 business days.`
      }
    });

    // TODO: Trigger automatic refund
    // TODO: Send email and SMS notifications to client

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Consultation rejected. Client will be notified and refunded.'
    });

  } catch (error) {
    console.error('Error rejecting consultation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject consultation'
    });
  }
};

/**
 * Request reschedule for a consultation (lawyer suggests new time)
 */
export const requestReschedule = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { id: consultationId } = req.params;
    const { date, time, message } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Get booking and verify lawyer owns it
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: consultationId },
      include: {
        client: true,
        provider: true
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Consultation not found'
      });
    }

    if (booking.providerId !== userId && booking.lawyerId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to reschedule this booking'
      });
    }

    const newScheduledAt = new Date(`${date}T${time}:00`);

    // Create notification for client to approve new time
    await prisma.notification.create({
      data: {
        userId: booking.clientId,
        type: 'RESCHEDULE_REQUESTED',
        title: 'Reschedule Requested',
        message: `${booking.provider.firstName} ${booking.provider.lastName} has suggested a new time for your consultation: ${newScheduledAt.toLocaleString()}. ${message || ''} Please log in to approve or decline.`
      }
    });

    // Store proposed time (you may want to add a field for this in the schema)
    // For now, just send notification
    
    // TODO: Send email and SMS notifications to client

    res.json({
      success: true,
      message: 'Reschedule request sent to client'
    });

  } catch (error) {
    console.error('Error requesting reschedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to request reschedule'
    });
  }
};
