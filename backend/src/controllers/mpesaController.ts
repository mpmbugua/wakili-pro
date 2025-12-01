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
    const { phoneNumber, amount, bookingId, reviewId, purchaseId, subscriptionId, paymentType } = req.body;
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

    // Validate booking, review, purchase, or subscription exists
    let targetId: string;
    let accountReference: string;
    let transactionDesc: string;
    let actualBookingId: string | undefined;
    let resourceType: 'BOOKING' | 'REVIEW' | 'PURCHASE' | 'SUBSCRIPTION';

    if (bookingId) {
      // Consultation or service booking payment
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
      resourceType = 'BOOKING';
      accountReference = `BOOKING-${bookingId.substring(0, 8)}`;
      transactionDesc = 'Legal Consultation Payment';
    } else if (purchaseId) {
      // Marketplace document purchase payment
      const purchase = await prisma.documentPurchase.findUnique({
        where: { id: purchaseId },
      });

      if (!purchase) {
        return res.status(404).json({
          success: false,
          message: 'Purchase not found',
        });
      }

      if (purchase.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to pay for this purchase',
        });
      }

      targetId = purchaseId;
      actualBookingId = null;
      resourceType = 'PURCHASE';
      accountReference = `PURCHASE-${purchaseId.substring(0, 8)}`;
      transactionDesc = 'Legal Document Purchase';
    } else if (reviewId) {
      // Document review/certification payment
      const review = await prisma.documentReview.findUnique({
        where: { id: reviewId },
      });

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Document review not found',
        });
      }

      if (review.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to pay for this review',
        });
      }

      targetId = reviewId;
      actualBookingId = null;
      resourceType = 'REVIEW';
      accountReference = `REVIEW-${reviewId.substring(0, 8)}`;
      transactionDesc = 'Document Review Payment';
    } else if (subscriptionId) {
      // Lawyer subscription payment
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found',
        });
      }

      if (subscription.lawyerId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to pay for this subscription',
        });
      }

      targetId = subscriptionId;
      actualBookingId = null;
      resourceType = 'SUBSCRIPTION';
      accountReference = `SUB-${subscriptionId.substring(0, 8)}`;
      transactionDesc = `Wakili Pro ${subscription.tier} Subscription`;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either bookingId, purchaseId, reviewId, or subscriptionId is required',
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
          resourceType, // 'BOOKING', 'PURCHASE', 'REVIEW', or 'SUBSCRIPTION'
          paymentType, // Optional: for additional categorization
          purchaseId: purchaseId || null,
          reviewId: reviewId || null,
          subscriptionId: subscriptionId || null,
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
      if (metadata?.resourceType === 'BOOKING' && payment.bookingId) {
        await prisma.serviceBooking.update({
          where: { id: payment.bookingId },
          data: { status: 'CONFIRMED' },
        });
        logger.info('Booking confirmed:', { bookingId: payment.bookingId });
      } else if (metadata?.resourceType === 'PURCHASE' && metadata?.purchaseId) {
        // Update document purchase status
        await prisma.documentPurchase.update({
          where: { id: metadata.purchaseId },
          data: { status: 'COMPLETED' },
        });
        logger.info('Document purchase completed:', { purchaseId: metadata.purchaseId });
      } else if (metadata?.resourceType === 'REVIEW' && metadata?.reviewId) {
        // Update document review status
        const docReview = await prisma.documentReview.findUnique({
          where: { id: metadata.reviewId },
        });
        if (docReview) {
          await prisma.documentReview.update({
            where: { id: metadata.reviewId },
            data: { status: 'PAYMENT_VERIFIED' },
          });
          logger.info('Document review payment verified:', { reviewId: metadata.reviewId });
        }
      } else if (metadata?.resourceType === 'SUBSCRIPTION' && metadata?.subscriptionId) {
        // Update subscription status and activate tier
        const subscription = await prisma.subscription.findUnique({
          where: { id: metadata.subscriptionId },
          include: { lawyer: true },
        });
        
        if (subscription) {
          // Update subscription to ACTIVE
          await prisma.subscription.update({
            where: { id: metadata.subscriptionId },
            data: { 
              status: 'ACTIVE',
              activatedAt: new Date(),
            },
          });

          // Update lawyer tier
          await prisma.lawyerProfile.update({
            where: { id: subscription.lawyerId },
            data: { 
              tier: subscription.tier,
              subscriptionStatus: 'ACTIVE',
            },
          });

          logger.info('Subscription activated:', { 
            subscriptionId: metadata.subscriptionId,
            tier: subscription.tier,
            lawyerId: subscription.lawyerId 
          });
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
