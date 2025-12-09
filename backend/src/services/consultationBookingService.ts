import { PrismaClient, ConsultationBookingStatus, ConsultationType, PayoutStatus } from '@prisma/client';
import { getAvailableSlots } from './availabilityService';
import EscrowService from './escrowService';
import Decimal from 'decimal.js';
import * as analyticsService from './analyticsService';

const prisma = new PrismaClient();

interface CreateBookingData {
  clientId: string;
  lawyerId: string;
  consultationType: ConsultationType;
  scheduledStart: Date;
  scheduledEnd: Date;
  phoneNumber: string;
  isEmergency?: boolean;
}

interface BookingWithDetails {
  id: string;
  clientId: string;
  lawyerId: string;
  consultationType: ConsultationType;
  status: ConsultationBookingStatus;
  scheduledStartTime: Date;
  scheduledEndTime: Date;
  clientPaymentAmount: number;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
  };
  lawyer: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string | null;
    lawyerProfile: {
      hourlyRate: number | null;
      specializations: string[];
    } | null;
  };
}

/**
 * Create a new consultation booking
 */
export const createConsultationBooking = async (
  data: CreateBookingData
): Promise<BookingWithDetails> => {
  try {
    // 1. Validate lawyer exists and get their rate
    const lawyer = await prisma.lawyerProfile.findUnique({
      where: { id: data.lawyerId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
      },
    });

    if (!lawyer) {
      throw new Error('Lawyer not found');
    }

    if (!lawyer.isVerified) {
      throw new Error('Lawyer profile is not verified');
    }

    if (!lawyer.hourlyRate) {
      throw new Error('Lawyer has not set hourly rate');
    }

    // 2. Validate client exists
    const client = await prisma.user.findUnique({
      where: { id: data.clientId },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // 3. Validate time slot is available
    const availableSlots = await getAvailableSlots(
      data.lawyerId,
      data.scheduledStart,
      Math.round((data.scheduledEnd.getTime() - data.scheduledStart.getTime()) / (1000 * 60))
    );

    const slotAvailable = availableSlots.some(
      (slot) =>
        new Date(slot.start).getTime() === data.scheduledStart.getTime() &&
        new Date(slot.end).getTime() === data.scheduledEnd.getTime()
    );

    if (!slotAvailable) {
      throw new Error('Selected time slot is not available');
    }

    // 4. Calculate consultation cost
    const durationMinutes =
      (data.scheduledEnd.getTime() - data.scheduledStart.getTime()) / (1000 * 60);
    const durationHours = durationMinutes / 60;
    let clientPaymentAmount = Number(lawyer.hourlyRate) * durationHours;
    
    // Check for first consultation 50% discount
    const clientUser = await prisma.user.findUnique({
      where: { id: data.clientId },
      select: { hasUsedFirstConsultDiscount: true }
    });

    const lawyerWithOptIn = await prisma.lawyerProfile.findUnique({
      where: { userId: data.lawyerId },
      select: { allowsFirstConsultDiscount: true }
    });

    const originalAmount = clientPaymentAmount;
    let isFirstConsultDiscount = false;
    
    if (!clientUser?.hasUsedFirstConsultDiscount && lawyerWithOptIn?.allowsFirstConsultDiscount !== false) {
      // Apply 50% discount (lawyer absorbs the cost)
      clientPaymentAmount = clientPaymentAmount * 0.5;
      isFirstConsultDiscount = true;
      
      // Mark discount as used
      await prisma.user.update({
        where: { id: data.clientId },
        data: { hasUsedFirstConsultDiscount: true }
      });

      // Track freebie usage
      await analyticsService.trackFreebieUsage(data.clientId, 'first_consult_discount', {
        originalAmount,
        discountedAmount: clientPaymentAmount,
        savingsAmount: originalAmount - clientPaymentAmount,
        lawyerId: data.lawyerId
      });
    }
    
    const platformCommissionRate = 0.10; // 10%
    const platformCommission = clientPaymentAmount * platformCommissionRate;
    const lawyerPayout = clientPaymentAmount - platformCommission;

    // 5. Create consultation booking
    const booking = await prisma.consultationBooking.create({
      data: {
        clientId: data.clientId,
        lawyerId: data.lawyerId,
        consultationType: data.consultationType,
        status: 'PENDING_PAYMENT',
        scheduledStartTime: data.scheduledStart,
        scheduledEndTime: data.scheduledEnd,
        duration: durationMinutes,
        clientPaymentAmount: clientPaymentAmount,
        platformCommissionRate: platformCommissionRate,
        platformCommission: platformCommission,
        lawyerPayout: lawyerPayout,
        isEmergency: data.isEmergency || false,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            lawyerProfile: {
              select: {
                hourlyRate: true,
                specializations: true,
              },
            },
          },
        },
      },
    });

    return booking as unknown as BookingWithDetails;
  } catch (error) {
    console.error('Error creating consultation booking:', error);
    throw error;
  }
};

/**
 * Get booking by ID
 */
export const getBookingById = async (
  bookingId: string,
  userId: string
): Promise<BookingWithDetails | null> => {
  try {
    const booking = await prisma.consultationBooking.findUnique({
      where: { id: bookingId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            lawyerProfile: {
              select: {
                hourlyRate: true,
                specializations: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return null;
    }

    // Verify user has access to this booking
    if (booking.clientId !== userId && booking.lawyer.id !== userId) {
      throw new Error('Unauthorized access to booking');
    }

    return booking as unknown as BookingWithDetails;
  } catch (error) {
    console.error('Error getting booking:', error);
    throw error;
  }
};

/**
 * Get all bookings for a user (client or lawyer)
 */
export const getUserBookings = async (
  userId: string,
  role: 'CLIENT' | 'LAWYER',
  filters?: {
    status?: ConsultationBookingStatus;
    upcoming?: boolean;
  }
): Promise<BookingWithDetails[]> => {
  try {
    const where: any = {};

    if (role === 'CLIENT') {
      where.clientId = userId;
    } else if (role === 'LAWYER') {
      where.lawyerId = userId;
    }

    // Apply status filter
    if (filters?.status) {
      where.status = filters.status;
    }

    // Apply upcoming filter
    if (filters?.upcoming) {
      where.scheduledStartTime = {
        gte: new Date(),
      };
    }

    const bookings = await prisma.consultationBooking.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            lawyerProfile: {
              select: {
                hourlyRate: true,
                specializations: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledStartTime: 'desc',
      },
    });

    return bookings as unknown as BookingWithDetails[];
  } catch (error) {
    console.error('Error getting user bookings:', error);
    throw error;
  }
};

/**
 * Confirm booking payment (called after M-Pesa success)
 */
export const confirmBookingPayment = async (
  bookingId: string,
  paymentId: string,
  mpesaReceiptNumber?: string
): Promise<void> => {
  try {
    // 1. Get booking details
    const booking = await prisma.consultationBooking.findUnique({
      where: { id: bookingId },
      select: {
        clientId: true,
        lawyerId: true,
        clientPaymentAmount: true,
        platformCommission: true,
        lawyerPayout: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // 2. Update booking with payment details
    await prisma.consultationBooking.update({
      where: { id: bookingId },
      data: {
        status: 'PAYMENT_CONFIRMED',
        mpesaTransactionId: paymentId,
        mpesaReceiptNumber: mpesaReceiptNumber,
        clientPaidAt: new Date(),
        clientPaymentStatus: 'COMPLETED',
      },
    });

    // 3. Hold payment in escrow
    await EscrowService.holdPayment({
      bookingId,
      amount: new Decimal(booking.clientPaymentAmount.toString()),
      clientId: booking.clientId,
      lawyerId: booking.lawyerId,
      platformCommission: new Decimal(booking.platformCommission.toString()),
      lawyerPayout: new Decimal(booking.lawyerPayout.toString()),
    });

    console.log(`✅ Payment confirmed and held in escrow for booking ${bookingId}`);
  } catch (error) {
    console.error('Error confirming booking payment:', error);
    throw error;
  }
};

/**
 * Confirm session completion (after consultation happened)
 * Dual confirmation: Both client AND lawyer must confirm
 * Payment auto-releases after both confirmations OR 24 hours from session end
 */
export const confirmSessionCompletion = async (
  bookingId: string,
  userId: string,
  confirmedBy: 'CLIENT' | 'LAWYER'
): Promise<{ bothConfirmed: boolean; payoutReleased: boolean }> => {
  try {
    const booking = await prisma.consultationBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        clientId: true,
        lawyerId: true,
        status: true,
        scheduledEndTime: true,
        clientConfirmed: true,
        lawyerConfirmed: true,
        clientPaymentStatus: true,
        payoutStatus: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Verify user is authorized
    if (confirmedBy === 'CLIENT' && booking.clientId !== userId) {
      throw new Error('Only the client can confirm as client');
    }
    if (confirmedBy === 'LAWYER' && booking.lawyerId !== userId) {
      throw new Error('Only the lawyer can confirm as lawyer');
    }

    // Check booking status
    if (booking.status !== 'PAYMENT_CONFIRMED' && booking.status !== 'SCHEDULED' && booking.status !== 'IN_PROGRESS') {
      throw new Error(`Cannot confirm booking with status: ${booking.status}`);
    }

    // Check if session time has passed
    if (new Date() < booking.scheduledEndTime) {
      throw new Error('Cannot confirm completion before session end time');
    }

    // Check if already confirmed by this party
    if (confirmedBy === 'CLIENT' && booking.clientConfirmed) {
      throw new Error('Client has already confirmed this session');
    }
    if (confirmedBy === 'LAWYER' && booking.lawyerConfirmed) {
      throw new Error('Lawyer has already confirmed this session');
    }

    // Update confirmation status
    const updateData: any = {
      actualEndTime: new Date(),
    };

    if (confirmedBy === 'CLIENT') {
      updateData.clientConfirmed = true;
      updateData.clientConfirmedAt = new Date();
    } else {
      updateData.lawyerConfirmed = true;
      updateData.lawyerConfirmedAt = new Date();
    }

    // Check if both parties will have confirmed after this update
    const bothWillConfirm =
      (confirmedBy === 'CLIENT' ? true : booking.clientConfirmed) &&
      (confirmedBy === 'LAWYER' ? true : booking.lawyerConfirmed);

    // If both confirm, mark as COMPLETED and release payment
    if (bothWillConfirm) {
      updateData.status = 'COMPLETED';
    }

    await prisma.consultationBooking.update({
      where: { id: bookingId },
      data: updateData,
    });

    let payoutReleased = false;

    // Release payment if both confirmed and payment is pending
    if (bothWillConfirm && booking.payoutStatus === PayoutStatus.PENDING && booking.clientPaymentStatus === 'COMPLETED') {
      await EscrowService.releasePayment({
        bookingId,
        reason: 'Session completed - both parties confirmed',
      });
      payoutReleased = true;
      console.log(`✅ Both parties confirmed - payment released for booking ${bookingId}`);
    }

    return {
      bothConfirmed: bothWillConfirm,
      payoutReleased,
    };
  } catch (error) {
    console.error('Error confirming session completion:', error);
    throw error;
  }
};

/**
 * Cancel a booking
 */
export const cancelBooking = async (
  bookingId: string,
  userId: string,
  reason?: string
): Promise<void> => {
  try {
    const booking = await prisma.consultationBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        clientId: true,
        lawyerId: true,
        status: true,
        scheduledStartTime: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Verify user has permission to cancel
    if (booking.clientId !== userId && booking.lawyerId !== userId) {
      throw new Error('Unauthorized to cancel this booking');
    }

    // Check if booking can be cancelled
    if (booking.status === 'COMPLETED') {
      throw new Error('Cannot cancel completed booking');
    }

    if (booking.status === 'CANCELLED') {
      throw new Error('Booking is already cancelled');
    }

    // Calculate time until session
    const hoursUntilSession =
      (booking.scheduledStartTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);

    // Check cancellation policy (e.g., must cancel 24 hours before)
    if (hoursUntilSession < 24 && booking.status === 'PAYMENT_CONFIRMED') {
      throw new Error('Cannot cancel within 24 hours of scheduled session');
    }

    // Update booking status
    await prisma.consultationBooking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Trigger refund through escrow service (if payment was made)
    if (booking.status === 'PAYMENT_CONFIRMED' || booking.status === 'SCHEDULED') {
      const cancelledBy = booking.clientId === userId ? 'CLIENT' : 'LAWYER';
      await EscrowService.refundPayment({
        bookingId,
        amount: new Decimal(0), // Amount calculated by escrow service based on policy
        reason: reason || 'Booking cancelled by user',
        cancelledBy,
      });
      console.log(`💸 Refund processed for cancelled booking ${bookingId}`);
    }
  } catch (error) {
    console.error('Error cancelling booking:', error);
    throw error;
  }
};

/**
 * Reschedule a booking
 */
export const rescheduleBooking = async (
  bookingId: string,
  newStart: Date,
  newEnd: Date,
  userId: string
): Promise<void> => {
  try {
    const booking = await prisma.consultationBooking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        clientId: true,
        lawyerId: true,
        status: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Only client can reschedule
    if (booking.clientId !== userId) {
      throw new Error('Only client can reschedule booking');
    }

    // Check if booking can be rescheduled
    if (booking.status !== 'PAYMENT_CONFIRMED' && booking.status !== 'SCHEDULED') {
      throw new Error('Only confirmed bookings can be rescheduled');
    }

    // Validate new time slot is available
    const durationMinutes = Math.round(
      (newEnd.getTime() - newStart.getTime()) / (1000 * 60)
    );

    const availableSlots = await getAvailableSlots(
      booking.lawyerId,
      newStart,
      durationMinutes
    );

    const slotAvailable = availableSlots.some(
      (slot) =>
        new Date(slot.start).getTime() === newStart.getTime() &&
        new Date(slot.end).getTime() === newEnd.getTime()
    );

    if (!slotAvailable) {
      throw new Error('New time slot is not available');
    }

    // Update booking
    await prisma.consultationBooking.update({
      where: { id: bookingId },
      data: {
        scheduledStartTime: newStart,
        scheduledEndTime: newEnd,
      },
    });

    // TODO: Send notification to lawyer about reschedule
  } catch (error) {
    console.error('Error rescheduling booking:', error);
    throw error;
  }
};

/**
 * Get upcoming bookings that need reminders
 */
export const getUpcomingBookingsForReminders = async (
  hoursAhead: number = 24
): Promise<BookingWithDetails[]> => {
  try {
    const now = new Date();
    const futureTime = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);

    const bookings = await prisma.consultationBooking.findMany({
      where: {
        status: 'PAYMENT_CONFIRMED',
        scheduledStartTime: {
          gte: now,
          lte: futureTime,
        },
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        lawyer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
            lawyerProfile: {
              select: {
                hourlyRate: true,
                specializations: true,
              },
            },
          },
        },
      },
    });

    return bookings as unknown as BookingWithDetails[];
  } catch (error) {
    console.error('Error getting upcoming bookings:', error);
    throw error;
  }
};
