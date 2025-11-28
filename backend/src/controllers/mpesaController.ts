import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { mpesaService } from '../services/mpesaDarajaService';
import { logger } from '../utils/logger';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Initiate M-Pesa STK Push payment
 * POST /api/payments/mpesa/initiate
 */
export const initiateMpesaPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { phoneNumber, amount, bookingId, reviewId, paymentType } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    // Validate required fields
    if (!phoneNumber || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and amount are required',
      });
    }

    // Validate phone number format
    const phoneRegex = /^(254|0)?[71]\d{8}$/;
    const cleanPhone = phoneNumber.replace(/[\s\-+]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Kenyan phone number. Use format: 0712345678 or 254712345678',
      });
    }

    // Validate amount (minimum KES 10)
    if (amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum payment amount is KES 10',
      });
    }

    // Validate booking or review exists
    let targetId: string;
    let accountReference: string;
    let transactionDesc: string;
    let actualBookingId: string | undefined;

    if (bookingId) {
      const booking = await prisma.serviceBooking.findUnique({
        where: { id: bookingId },
      });

      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Booking not found',
        });
      }

      if (booking.clientId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to pay for this booking',
        });
      }

      targetId = bookingId;
      actualBookingId = bookingId;
      accountReference = `BOOKING-${bookingId.substring(0, 8)}`;
      transactionDesc = 'Legal Consultation Payment';
    } else if (reviewId) {
      // For document reviews, we need to create or find a dummy booking
      // since Payment model requires bookingId (non-optional field)
      let dummyBooking = await prisma.serviceBooking.findFirst({
        where: {
          clientId: userId,
          type: 'document-review-payment',
        },
      });

      if (!dummyBooking) {
        // Create a dummy booking for document payment tracking
        dummyBooking = await prisma.serviceBooking.create({
          data: {
            clientId: userId,
            lawyerId: 'system',
            type: 'document-review-payment',
            status: 'PENDING',
            scheduledFor: new Date(),
          },
        });
      }

      targetId = reviewId;
      actualBookingId = dummyBooking.id;
      accountReference = `REVIEW-${reviewId.substring(0, 8)}`;
      transactionDesc = paymentType === 'MARKETPLACE_PURCHASE' 
        ? 'Legal Document Purchase'
        : 'Document Review Payment';
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either bookingId or reviewId is required',
      });
    }

    // Create pending payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        bookingId: actualBookingId,
        targetId,
        amount,
        type: 'DOCUMENT', // Use DOCUMENT type from PaymentType enum for all document-related payments
        status: 'PENDING',
        provider: 'MPESA',
        method: 'MPESA',
        metadata: {
          phoneNumber,
          accountReference,
          paymentType, // Store the specific payment type in metadata
          isDocumentPayment: !!reviewId,
          actualReviewId: reviewId,
        },
      },
    });

    logger.info('Created pending payment:', {
      paymentId: payment.id,
      amount,
      targetId,
    });

    // Initiate STK Push
    const stkResponse = await mpesaService.initiateSTKPush({
      phoneNumber,
      amount,
      accountReference,
      transactionDesc,
    });

    // Update payment with M-Pesa request IDs
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        metadata: {
          phoneNumber,
          accountReference,
          merchantRequestID: stkResponse.MerchantRequestID,
          checkoutRequestID: stkResponse.CheckoutRequestID,
        },
      },
    });

    return res.status(200).json({
      success: true,
      message: 'STK Push sent. Please check your phone and enter M-Pesa PIN.',
      data: {
        paymentId: payment.id,
        checkoutRequestID: stkResponse.CheckoutRequestID,
        customerMessage: stkResponse.CustomerMessage,
      },
    });
  } catch (error: any) {
    logger.error('M-Pesa initiation error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate M-Pesa payment',
    });
  }
};

/**
 * M-Pesa callback handler
 * POST /api/payments/mpesa/callback
 * Called by Safaricom when customer completes/cancels payment
 */
export const mpesaCallback = async (req: Request, res: Response) => {
  try {
    logger.info('Received M-Pesa callback:', JSON.stringify(req.body, null, 2));

    const callbackResult = mpesaService.processCallback(req.body);

    // Find payment by CheckoutRequestID
    const payment = await prisma.payment.findFirst({
      where: {
        metadata: {
          path: ['checkoutRequestID'],
          equals: callbackResult.checkoutRequestID,
        },
      },
    });

    if (!payment) {
      logger.warn('Payment not found for callback:', {
        checkoutRequestID: callbackResult.checkoutRequestID,
      });
      // Still return 200 to Safaricom to acknowledge receipt
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (callbackResult.success) {
      // Payment successful
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          transactionId: callbackResult.transactionId,
          externalTransactionId: callbackResult.transactionId,
          verifiedAt: new Date(),
          metadata: {
            ...(payment.metadata as any),
            mpesaReceiptNumber: callbackResult.transactionId,
            paidAmount: callbackResult.amount,
            paidPhoneNumber: callbackResult.phoneNumber,
            resultDesc: callbackResult.resultDesc,
          },
        },
      });

      // Update booking status if it's a booking payment
      const metadata = payment.metadata as any;
      if (payment.bookingId && !metadata?.isDocumentPayment) {
        await prisma.serviceBooking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' },
        });
      } else if (metadata?.isDocumentPayment && metadata?.actualReviewId) {
        // Update document review/purchase status
        if (metadata.paymentType === 'MARKETPLACE_PURCHASE') {
          await prisma.documentPurchase.update({
            where: { id: metadata.actualReviewId },
            data: { status: 'COMPLETED' },
          });
        } else {
          // Update DocumentReview status if needed
          const docReview = await prisma.documentReview.findUnique({
            where: { id: metadata.actualReviewId },
          });
          if (docReview) {
            await prisma.documentReview.update({
              where: { id: metadata.actualReviewId },
              data: { status: 'PAYMENT_VERIFIED' },
            });
          }
        }
      }

      logger.info('Payment completed successfully:', {
        paymentId: payment.id,
        transactionId: callbackResult.transactionId,
      });
    } else {
      // Payment failed or cancelled
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          metadata: {
            ...(payment.metadata as any),
            resultCode: callbackResult.resultCode,
            resultDesc: callbackResult.resultDesc,
          },
        },
      });

      logger.warn('Payment failed:', {
        paymentId: payment.id,
        resultCode: callbackResult.resultCode,
        resultDesc: callbackResult.resultDesc,
      });
    }

    // Always return 200 to Safaricom
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error: any) {
    logger.error('M-Pesa callback processing error:', error);
    // Still return 200 to prevent Safaricom from retrying
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

/**
 * M-Pesa timeout handler
 * POST /api/payments/mpesa/timeout
 * Called by Safaricom when transaction times out
 */
export const mpesaTimeout = async (req: Request, res: Response) => {
  try {
    logger.warn('M-Pesa timeout received:', JSON.stringify(req.body, null, 2));

    // Find and mark payment as failed
    const checkoutRequestID = req.body?.Body?.stkCallback?.CheckoutRequestID;

    if (checkoutRequestID) {
      const payment = await prisma.payment.findFirst({
        where: {
          metadata: {
            path: ['checkoutRequestID'],
            equals: checkoutRequestID,
          },
        },
      });

      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...(payment.metadata as any),
              timeout: true,
              resultDesc: 'Transaction timeout',
            },
          },
        });
      }
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error: any) {
    logger.error('M-Pesa timeout processing error:', error);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
};

/**
 * Check payment status
 * GET /api/payments/mpesa/status/:paymentId
 */
export const checkPaymentStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user?.id;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found',
      });
    }

    // Verify user owns this payment
    if (payment.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this payment',
      });
    }

    // If payment is still pending, query M-Pesa API
    if (payment.status === 'PENDING') {
      const metadata = payment.metadata as any;
      if (metadata?.checkoutRequestID) {
        try {
          const queryResult = await mpesaService.querySTKPush(
            metadata.checkoutRequestID
          );

          // Update payment status based on query result
          if (queryResult.ResultCode === '0') {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'COMPLETED',
                verifiedAt: new Date(),
              },
            });
            payment.status = 'COMPLETED';
          } else if (queryResult.ResultCode !== '1032') {
            // 1032 = Request cancelled by user (still pending)
            await prisma.payment.update({
              where: { id: payment.id },
              data: { status: 'FAILED' },
            });
            payment.status = 'FAILED';
          }
        } catch (error) {
          logger.error('Failed to query M-Pesa status:', error);
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        verifiedAt: payment.verifiedAt,
      },
    });
  } catch (error: any) {
    logger.error('Check payment status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check payment status',
    });
  }
};

/**
 * Get payment history for user
 * GET /api/payments/history
 */
export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated',
      });
    }

    const payments = await prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        amount: true,
        status: true,
        provider: true,
        method: true,
        transactionId: true,
        createdAt: true,
        verifiedAt: true,
        type: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error: any) {
    logger.error('Get payment history error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment history',
    });
  }
};
