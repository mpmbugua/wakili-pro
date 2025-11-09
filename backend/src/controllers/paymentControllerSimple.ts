import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  CreatePaymentIntentSchema,
  PaymentVerificationSchema
} from '../../../shared/src/schemas/payment';
import { z } from 'zod';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const createPaymentIntent = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const validatedData = CreatePaymentIntentSchema.parse(req.body);
    
    // Verify booking exists and user is authorized
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        service: {
          select: { title: true, priceKES: true }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.clientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to pay for this booking'
      });
    }

    if (booking.paymentStatus === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Booking already paid'
      });
    }

    // Create payment record (simplified version)
    const paymentIntent = {
      id: `payment_${Date.now()}`,
      bookingId: validatedData.bookingId,
      userId: userId,
      amount: booking.totalAmountKES,
      method: validatedData.paymentMethod,
      status: 'PENDING',
      createdAt: new Date()
    };

    // For now, we'll simulate payment processing
    // In production, this would integrate with actual payment providers
    
    res.status(201).json({
      success: true,
      data: paymentIntent,
      message: 'Payment intent created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    logger.error('Create payment intent error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent'
    });
  }
};

export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = PaymentVerificationSchema.parse(req.body);
    
    // Simplified verification - in production this would check with payment providers
    const verificationResult = {
      success: true,
      status: 'COMPLETED',
      transactionId: validatedData.transactionId,
      message: 'Payment verified successfully'
    };

    res.json({
      success: true,
      data: verificationResult,
      message: 'Payment verified successfully'
    });

  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { page = 1, limit = 10 } = req.query;
    
    // Get user's bookings with payment information
    const bookings = await prisma.serviceBooking.findMany({
      where: { 
        OR: [
          { clientId: userId },
          { providerId: userId }
        ]
      },
      include: {
        service: {
          select: { title: true, type: true }
        },
        client: {
          select: { firstName: true, lastName: true }
        },
        provider: {
          select: { firstName: true, lastName: true }
        }
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    });

    // Transform bookings to payment history format
    const paymentHistory = bookings.map(booking => ({
      id: booking.id,
      amount: booking.totalAmountKES,
      status: booking.paymentStatus,
      method: 'PENDING', // Would come from actual payment records
      serviceTitle: booking.service.title,
      serviceType: booking.service.type,
      clientName: `${booking.client.firstName} ${booking.client.lastName}`,
      providerName: `${booking.provider.firstName} ${booking.provider.lastName}`,
      createdAt: booking.createdAt
    }));

    res.json({
      success: true,
      data: {
        payments: paymentHistory,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: paymentHistory.length
        }
      }
    });

  } catch (error) {
    logger.error('Get payment history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history'
    });
  }
};

export const processPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Verify booking exists
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.clientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update booking payment status
    const updatedBooking = await prisma.serviceBooking.update({
      where: { id: bookingId },
      data: { 
        paymentStatus: 'PAID',
        status: 'CONFIRMED'
      }
    });

    res.json({
      success: true,
      data: updatedBooking,
      message: 'Payment processed successfully'
    });

  } catch (error) {
    logger.error('Process payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment processing failed'
    });
  }
};