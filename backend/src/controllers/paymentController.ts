import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import axios from 'axios';
import { 
  CreatePaymentIntentSchema,
  PaymentVerificationSchema,
  RefundRequestSchema,
  EscrowReleaseSchema,
  PaymentWebhookSchema
} from '@wakili-pro/shared/src/schemas/payment';
import { z } from 'zod';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-10-29.clover',
});

// M-Pesa Configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  businessShortCode: process.env.MPESA_BUSINESS_SHORTCODE || '174379',
  passkey: process.env.MPESA_PASSKEY || '',
  baseURL: process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke',
  callbackURL: process.env.MPESA_CALLBACK_URL || 'https://wakili-pro.com/api/payments/mpesa/callback'
};

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Generate M-Pesa Access Token
async function generateMpesaToken(): Promise<string> {
  try {
    const credentials = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    
    const response = await axios.get(
      `${MPESA_CONFIG.baseURL}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${credentials}`
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    logger.error('M-Pesa token generation failed:', error);
    throw new Error('Failed to generate M-Pesa access token');
  }
}

// Generate M-Pesa Password
function generateMpesaPassword(): { password: string; timestamp: string } {
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const password = Buffer.from(`${MPESA_CONFIG.businessShortCode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
  return { password, timestamp };
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
        },
        client: {
          select: { email: true, firstName: true, lastName: true }
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

    let paymentIntent;

    if (validatedData.paymentMethod === 'MPESA') {
      // Process M-Pesa Payment
      const mpesaDetails = validatedData.mpesaDetails!;
      const token = await generateMpesaToken();
      const { password, timestamp } = generateMpesaPassword();

      const mpesaPayload = {
        BusinessShortCode: MPESA_CONFIG.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: booking.totalAmountKES,
        PartyA: mpesaDetails.phoneNumber,
        PartyB: MPESA_CONFIG.businessShortCode,
        PhoneNumber: mpesaDetails.phoneNumber,
        CallBackURL: MPESA_CONFIG.callbackURL,
        AccountReference: mpesaDetails.accountReference,
        TransactionDesc: mpesaDetails.transactionDesc
      };

      const mpesaResponse = await axios.post(
        `${MPESA_CONFIG.baseURL}/mpesa/stkpush/v1/processrequest`,
        mpesaPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      paymentIntent = await prisma.payment.create({
        data: {
          bookingId: validatedData.bookingId,
          userId: userId,
          amount: booking.totalAmountKES,
          method: 'MPESA',
          status: 'PENDING',
          externalTransactionId: mpesaResponse.data.CheckoutRequestID,
          metadata: {
            mpesaRequestId: mpesaResponse.data.CheckoutRequestID,
            phoneNumber: mpesaDetails.phoneNumber
          }
        }
      });

    } else if (validatedData.paymentMethod === 'STRIPE_CARD') {
      // Process Stripe Payment
      const stripeDetails = validatedData.stripeDetails!;
      
      const stripePaymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(booking.totalAmountKES * 100), // Convert KES to cents
        currency: 'kes',
        payment_method: stripeDetails.paymentMethodId,
        receipt_email: stripeDetails.customerEmail,
        description: stripeDetails.description,
        metadata: {
          bookingId: validatedData.bookingId,
          userId: userId,
          serviceTitle: booking.service.title
        },
        confirm: true,
        return_url: `${process.env.FRONTEND_URL}/payment/success`
      });

      paymentIntent = await prisma.payment.create({
        data: {
          bookingId: validatedData.bookingId,
          userId: userId,
          amount: booking.totalAmountKES,
          method: 'STRIPE_CARD',
          status: stripePaymentIntent.status === 'succeeded' ? 'PAID' : 'PENDING',
          externalTransactionId: stripePaymentIntent.id,
          metadata: {
            stripePaymentIntentId: stripePaymentIntent.id,
            customerEmail: stripeDetails.customerEmail
          }
        }
      });

      // Update booking payment status if Stripe payment succeeded immediately
      if (stripePaymentIntent.status === 'succeeded') {
        await prisma.serviceBooking.update({
          where: { id: validatedData.bookingId },
          data: { paymentStatus: 'PAID' }
        });
      }
    }

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
    
    const payment = await prisma.payment.findUnique({
      where: { id: validatedData.transactionId },
      include: {
        booking: {
          include: {
            service: { select: { title: true } }
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    let verificationResult;

    if (validatedData.paymentMethod === 'MPESA') {
      // Verify M-Pesa payment status
      const token = await generateMpesaToken();
      const { password, timestamp } = generateMpesaPassword();

      const queryPayload = {
        BusinessShortCode: MPESA_CONFIG.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: payment.externalTransactionId
      };

      const mpesaResponse = await axios.post(
        `${MPESA_CONFIG.baseURL}/mpesa/stkpushquery/v1/query`,
        queryPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const isSuccessful = mpesaResponse.data.ResultCode === '0';
      verificationResult = {
        success: isSuccessful,
        status: isSuccessful ? 'PAID' : 'FAILED',
        externalData: mpesaResponse.data
      };

    } else if (validatedData.paymentMethod === 'STRIPE_CARD') {
      // Verify Stripe payment
      const stripePaymentIntent = await stripe.paymentIntents.retrieve(payment.externalTransactionId!);
      
      verificationResult = {
        success: stripePaymentIntent.status === 'succeeded',
        status: stripePaymentIntent.status === 'succeeded' ? 'PAID' : 'FAILED',
        externalData: stripePaymentIntent
      };
    }

    // Update payment status
    if (!verificationResult) {
      return res.status(500).json({
        success: false,
        message: 'Payment verification failed'
      });
    }

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        status: verificationResult.success ? 'PAID' : 'FAILED',
        verifiedAt: verificationResult.success ? new Date() : undefined
      }
    });

    // Update booking payment status if successful
    if (verificationResult.success) {
      await prisma.serviceBooking.update({
        where: { id: payment.bookingId },
        data: { paymentStatus: 'PAID' }
      });

      // Create escrow record
      await prisma.escrowTransaction.create({
        data: {
          paymentId: payment.id,
          amount: payment.amount,
          status: 'HELD',
          releaseDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
        }
      });
    }

    res.json({
      success: true,
      data: {
        payment: updatedPayment,
        verification: verificationResult
      },
      message: verificationResult.success ? 'Payment verified successfully' : 'Payment verification failed'
    });

  } catch (error) {
    logger.error('Payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment'
    });
  }
};

export const processRefund = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = RefundRequestSchema.parse(req.body);
    
    const payment = await prisma.payment.findUnique({
      where: { id: validatedData.paymentId },
      include: {
        booking: {
          include: {
            service: { 
              select: { providerId: true } 
            }
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Verify user authorization (client or service provider can request refund)
    const userId = req.user?.id;
    if (userId !== payment.userId && userId !== payment.booking.service.providerId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to refund this payment'
      });
    }

    if (payment.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed payments'
      });
    }

    const refundAmount = validatedData.amount || payment.amount;

    let refundResult;

    if (payment.method === 'STRIPE_CARD') {
      // Process Stripe refund
      const stripeRefund = await stripe.refunds.create({
        payment_intent: payment.externalTransactionId!,
        amount: Math.round(refundAmount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          originalPaymentId: payment.id,
          refundReason: validatedData.reason
        }
      });

      refundResult = {
        success: true,
        externalRefundId: stripeRefund.id
      };

    } else if (payment.method === 'MPESA') {
      // M-Pesa refunds typically require manual processing
      // For now, we'll create a refund record for manual processing
      refundResult = {
        success: true,
        externalRefundId: `MPESA_REFUND_${Date.now()}`
      };
    }

    // Create refund record
    const refund = await prisma.refund.create({
      data: {
        paymentId: payment.id,
        amount: refundAmount,
        reason: validatedData.reason,
        status: 'PENDING',
        externalRefundId: refundResult?.externalRefundId || null,
        requestedBy: userId!
      }
    });

    res.json({
      success: true,
      data: refund,
      message: 'Refund initiated successfully'
    });

  } catch (error) {
    logger.error('Refund processing error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund'
    });
  }
};

export const releaseEscrow = async (req: AuthRequest, res: Response) => {
  try {
    const validatedData = EscrowReleaseSchema.parse(req.body);
    
    const booking = await prisma.serviceBooking.findUnique({
      where: { id: validatedData.bookingId },
      include: {
        service: {
          select: { providerId: true }
        },
        payments: {
          where: { status: 'PAID' },
          include: {
            escrowTransaction: true
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: 'Can only release escrow for completed bookings'
      });
    }

    const payment = booking.payments[0];
    if (!payment?.escrowTransaction) {
      return res.status(404).json({
        success: false,
        message: 'No escrow transaction found'
      });
    }

    if (payment.escrowTransaction.status !== 'HELD') {
      return res.status(400).json({
        success: false,
        message: 'Escrow already released or cancelled'
      });
    }

    // Calculate platform fee (default 10%)
    const platformFeeRate = 0.10;
    const platformFee = validatedData.platformFee || (validatedData.releaseAmount * platformFeeRate);
    const lawyerPayout = validatedData.releaseAmount - platformFee;

    // Release escrow
    await prisma.escrowTransaction.update({
      where: { id: payment.escrowTransaction.id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
        platformFee: platformFee,
        lawyerPayout: lawyerPayout
      }
    });

    // Create wallet transaction for lawyer payout
    await prisma.walletTransaction.create({
      data: {
        userId: booking.providerId,
        type: 'PAYOUT',
        amount: lawyerPayout,
        description: `Payout for service`,
        referenceId: booking.id,
        status: 'COMPLETED'
      }
    });

    res.json({
      success: true,
      message: 'Escrow released successfully',
      data: {
        platformFee,
        lawyerPayout,
        releasedAt: new Date()
      }
    });

  } catch (error) {
    logger.error('Escrow release error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to release escrow'
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

    const { page = 1, limit = 10, status, method } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { userId };
    if (status) where.status = status;
    if (method) where.method = method;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          booking: {
            include: {
              service: {
                select: { title: true, type: true }
              }
            }
          },
          refunds: {
            select: { amount: true, status: true, createdAt: true }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.payment.count({ where })
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        payments,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages
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

export const handlePaymentWebhook = async (req: Request, res: Response) => {
  try {
    const validatedData = PaymentWebhookSchema.parse(req.body);
    
    logger.info('Payment webhook received:', validatedData);

    if (validatedData.provider === 'MPESA') {
      // Handle M-Pesa callback
      const { transactionId, status } = validatedData;
      
      const payment = await prisma.payment.findFirst({
        where: { externalTransactionId: transactionId }
      });
      
      if (payment) {
        // Map webhook status to PaymentStatus enum
        let paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' = 'PENDING';
        if (status === 'COMPLETED') paymentStatus = 'PAID';
        else if (status === 'FAILED') paymentStatus = 'FAILED';
        else if (status === 'REFUNDED') paymentStatus = 'REFUNDED';
        
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: paymentStatus,
            verifiedAt: paymentStatus === 'PAID' ? new Date() : undefined
          }
        });
      }

      if (status === 'COMPLETED') {
        // Update booking payment status
        const payment = await prisma.payment.findFirst({
          where: { externalTransactionId: transactionId }
        });

        if (payment) {
          await prisma.serviceBooking.update({
            where: { id: payment.bookingId },
            data: { paymentStatus: 'PAID' }
          });
        }
      }

    } else if (validatedData.provider === 'STRIPE') {
      // Handle Stripe webhook
      // Stripe webhook verification should be done here
      // For now, we'll process the status update
    }

    res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    logger.error('Payment webhook error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process webhook'
    });
  }
};
