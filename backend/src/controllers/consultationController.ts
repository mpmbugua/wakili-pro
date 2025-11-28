import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Consultation booking schema
const CreateConsultationSchema = z.object({
  lawyerId: z.string().min(1, 'Lawyer ID is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  duration: z.string().default('60'),
  consultationType: z.enum(['video', 'phone', 'in-person']),
  description: z.string().min(10, 'Please provide a brief description of your legal matter'),
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
    const scheduledDateTime = new Date(`${validatedData.date}T${validatedData.time}:00`);

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
