import { Router } from 'express';
import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { mpesaService } from '../services/payment/mpesaService';
import { flutterwaveService } from '../services/payment/flutterwaveService';
import * as documentReviewPricingService from '../services/documentReviewPricingService';
import { authenticateToken as authenticate } from '../middleware/auth';
import { reviewDocumentWithAI } from '../services/documentAIReview';
import { assignLawyerToDocumentReview } from '../services/lawyerAssignmentService';

const router = Router();

// Validation schemas
const initiatePaymentSchema = z.object({
  documentId: z.string().min(1, 'Document ID is required'), // Accept any non-empty string (cuid or uuid)
  serviceType: z.enum(['ai_review', 'certification', 'ai_and_certification']),
  urgencyLevel: z.enum(['standard', 'urgent', 'emergency']),
  paymentMethod: z.enum(['mpesa', 'card']),
  phoneNumber: z.string().optional(), // Required for M-Pesa
  email: z.string().email().optional() // Required for card payment
});

interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

/**
 * POST /api/document-payment/initiate
 * Initiate payment for document review (M-Pesa or Stripe)
 */
router.post('/initiate', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    console.log('[DocumentPayment] Received payment initiation request');
    console.log('[DocumentPayment] Request body:', JSON.stringify(req.body, null, 2));
    console.log('[DocumentPayment] User ID:', req.user?.id);
    
    // Validate request
    const validatedData = initiatePaymentSchema.parse(req.body);
    const userId = req.user?.id;

    console.log('[DocumentPayment] Validation passed, validated data:', validatedData);

    if (!userId) {
      console.error('[DocumentPayment] No user ID found');
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    console.log('[DocumentPayment] Looking up document:', validatedData.documentId, 'for user:', userId);
    
    // Verify document belongs to user
    const document = await prisma.userDocument.findFirst({
      where: {
        id: validatedData.documentId,
        userId
      }
    });

    console.log('[DocumentPayment] Document found:', !!document);

    if (!document) {
      console.error('[DocumentPayment] Document not found or does not belong to user');
      res.status(404).json({ error: 'Document not found or you do not have permission to access it' });
      return;
    }

    // Map service type to ReviewType enum
    let reviewTypeForPricing: 'AI_ONLY' | 'CERTIFICATION' | 'AI_PLUS_CERTIFICATION' = 'AI_ONLY';
    if (validatedData.serviceType === 'certification') {
      reviewTypeForPricing = 'CERTIFICATION';
    } else if (validatedData.serviceType === 'ai_and_certification') {
      reviewTypeForPricing = 'AI_PLUS_CERTIFICATION';
    }

    // Map urgency level
    let urgencyForPricing: 'STANDARD' | 'EXPRESS' | 'ECONOMY' = 'STANDARD';
    if (validatedData.urgencyLevel === 'urgent') {
      urgencyForPricing = 'EXPRESS';
    } else if (validatedData.urgencyLevel === 'emergency') {
      urgencyForPricing = 'EXPRESS';
    }

    // Calculate pricing
    const pricing = documentReviewPricingService.calculateDocumentReviewPricing(
      reviewTypeForPricing as any,
      urgencyForPricing as any
    );

    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        user: { connect: { id: userId } },
        amount: Math.round(pricing.total * 100), // Store as cents for consistency
        type: 'DOCUMENT',
        provider: validatedData.paymentMethod === 'mpesa' ? 'MPESA' : 'FLUTTERWAVE',
        method: validatedData.paymentMethod === 'mpesa' ? 'MPESA' : 'STRIPE_CARD', // Keep as STRIPE_CARD for compatibility
        status: 'PENDING',
        metadata: {
          currency: 'KES', // Kenya Shillings
          documentId: validatedData.documentId,
          serviceType: validatedData.serviceType,
          urgencyLevel: validatedData.urgencyLevel,
          pricing
        } as any
      }
    });

    // Route to appropriate payment service
    if (validatedData.paymentMethod === 'mpesa') {
      if (!validatedData.phoneNumber) {
        res.status(400).json({ error: 'Phone number required for M-Pesa' });
        return;
      }

      console.log('[DocumentPayment] Initiating M-Pesa payment:', {
        phoneNumber: validatedData.phoneNumber,
        amount: pricing.total,
        paymentId: payment.id
      });

      const mpesaResponse = await mpesaService.initiatePayment({
        phoneNumber: validatedData.phoneNumber,
        amount: pricing.total,
        accountReference: payment.id,
        transactionDesc: `Document review - ${validatedData.serviceType}`
      });

      console.log('[DocumentPayment] M-Pesa response:', mpesaResponse);

      if (!mpesaResponse.success) {
        console.error('[DocumentPayment] M-Pesa failed:', mpesaResponse.errorMessage);
        
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: 'FAILED',
            metadata: {
              ...(payment.metadata as any),
              errorMessage: mpesaResponse.errorMessage
            } as any
          }
        });

        res.status(400).json({
          error: mpesaResponse.errorMessage || 'Payment initiation failed'
        });
        return;
      }

      // Update payment with M-Pesa transaction ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          metadata: {
            ...(payment.metadata as any),
            mpesaCheckoutRequestId: mpesaResponse.checkoutRequestID,
            mpesaMerchantRequestId: mpesaResponse.merchantRequestID
          } as any
        }
      });

      console.log('[DocumentPayment] Payment successful, returning response');

      res.status(200).json({
        success: true,
        data: {
          paymentId: payment.id,
          customerMessage: 'STK Push sent to phone. Please enter M-Pesa PIN.',
          checkoutRequestId: mpesaResponse.checkoutRequestID
        }
      });
    } else if (validatedData.paymentMethod === 'card') {
      const customerEmail = validatedData.email || req.user?.email;

      if (!customerEmail) {
        res.status(400).json({ error: 'Email required for card payment' });
        return;
      }

      const flutterwaveResponse = await flutterwaveService.initiatePayment({
        amount: pricing.total,
        currency: 'KES',
        customerEmail,
        description: `Document review - ${validatedData.serviceType}`,
        metadata: {
          paymentId: payment.id,
          documentId: validatedData.documentId,
          serviceType: validatedData.serviceType,
          urgencyLevel: validatedData.urgencyLevel
        },
        redirectUrl: `${process.env.FRONTEND_URL}/payment-callback`
      });

      if (!flutterwaveResponse.success) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            status: 'FAILED',
            metadata: {
              ...(payment.metadata as any),
              errorMessage: flutterwaveResponse.errorMessage
            } as any
          }
        });

        res.status(400).json({
          error: flutterwaveResponse.errorMessage || 'Payment initiation failed'
        });
        return;
      }

      // Update payment with Flutterwave transaction ID
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          transactionId: flutterwaveResponse.transactionId,
          metadata: {
            ...(payment.metadata as any),
            flutterwaveTransactionId: flutterwaveResponse.transactionId
          } as any
        }
      });

      res.status(200).json({
        success: true,
        paymentId: payment.id,
        paymentMethod: 'card',
        paymentLink: flutterwaveResponse.paymentLink,
        message: 'Payment link generated. Redirecting to Flutterwave.'
      });
    }
  } catch (error: any) {
    console.error('[DocumentPayment] Payment initiation error:', error);
    console.error('[DocumentPayment] Error stack:', error.stack);
    
    if (error instanceof z.ZodError) {
      console.error('[DocumentPayment] Validation error:', JSON.stringify(error.errors, null, 2));
      const firstError = error.errors[0];
      const fieldName = firstError.path.join('.');
      res.status(400).json({ 
        error: `Invalid ${fieldName}: ${firstError.message}`,
        details: error.errors 
      });
      return;
    }

    res.status(500).json({ error: error.message || 'Failed to initiate payment' });
  }
});

/**
 * POST /api/document-payment/mpesa-callback
 * M-Pesa callback handler
 */
router.post('/mpesa-callback', async (req: Request, res: Response) => {
  try {
    const callbackData = req.body;
    console.log('M-Pesa callback received:', JSON.stringify(callbackData, null, 2));

    const result = mpesaService.processCallback(callbackData);

    if (!result || result.resultCode !== 0) {
      const errorMsg = (result as any)?.resultDescription || 'Unknown error';
      console.error('M-Pesa callback processing failed:', errorMsg);
      res.status(200).json({ ResultCode: 1, ResultDesc: 'Callback processing failed' });
      return;
    }

    // Find payment by checkout request ID stored in metadata
    const payments = await prisma.payment.findMany({
      where: {
        method: 'MPESA',
        status: 'PENDING'
      }
    });

    const payment = payments.find((p: any) => {
      const metadata = p.metadata as any;
      return metadata?.mpesaCheckoutRequestId === result.checkoutRequestID;
    });

    if (!payment) {
      console.error('Payment not found for checkout request:', result.checkoutRequestID);
      res.status(200).json({ ResultCode: 1, ResultDesc: 'Payment not found' });
      return;
    }

    // Update payment status
    if (result.resultCode === 0) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          verifiedAt: new Date(),
          metadata: {
            ...(payment.metadata as any),
            mpesaReceiptNumber: result.mpesaReceiptNumber
          } as any
        }
      });

      // Create document review request
      await createDocumentReviewRequest(payment);
    } else {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          metadata: {
            ...(payment.metadata as any),
            errorMessage: (result as any)?.resultDescription || 'Payment failed'
          } as any
        }
      });
    }

    res.status(200).json({ ResultCode: 0, ResultDesc: 'Callback processed successfully' });
  } catch (error: any) {
    console.error('M-Pesa callback error:', error);
    res.status(200).json({ ResultCode: 1, ResultDesc: 'Internal error' });
  }
});

/**
 * POST /api/document-payment/flutterwave-webhook
 * Flutterwave webhook handler
 */
router.post('/flutterwave-webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['verif-hash'] as string;

    if (!signature) {
      res.status(400).json({ error: 'Missing verif-hash header' });
      return;
    }

    // Verify webhook signature
    if (!flutterwaveService.verifyWebhookSignature(req.body, signature)) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    console.log('Flutterwave webhook received:', req.body.event);

    // Process webhook event
    const result = await flutterwaveService.processWebhookEvent(req.body);

    if (result.transactionId && result.metadata) {
      const paymentId = result.metadata.paymentId;

      if (paymentId) {
        const payment = await prisma.payment.findUnique({
          where: { id: paymentId }
        });

        if (payment) {
          // Update payment based on event type
          if (result.status === 'successful') {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'PAID',
                verifiedAt: new Date()
              }
            });

            // Create document review request
            await createDocumentReviewRequest(payment);
          } else if (result.status === 'failed') {
            await prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'FAILED',
                metadata: {
                  ...(payment.metadata as any),
                  errorMessage: `Payment ${result.status}`
                } as any
              }
            });
          }
        }
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Flutterwave webhook error:', error);
    res.status(400).json({ error: 'Webhook processing failed' });
  }
});

/**
 * GET /api/document-payment/:paymentId/status
 * Check payment status
 */
router.get('/:paymentId/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId
      }
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    // Find associated document review request
    const documentReview = await prisma.documentReview.findFirst({
      where: {
        paymentId: payment.id
      }
    });

    const metadata = payment.metadata as any;
    res.status(200).json({
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount / 100, // Convert back from cents
        currency: metadata?.currency || 'KES',
        paymentMethod: payment.method,
        verifiedAt: payment.verifiedAt,
        documentReview
      }
    });
  } catch (error: any) {
    console.error('Payment status check error:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

/**
 * Helper: Create document review request after successful payment
 */
async function createDocumentReviewRequest(payment: any): Promise<void> {
  try {
    const metadata = payment.metadata as any;

    const deliveryEstimate = documentReviewPricingService.calculateDeliveryEstimate(
      metadata.urgencyLevel
    );

    // Map service type to review type
    let reviewType: 'AI_ONLY' | 'CERTIFICATION' | 'AI_PLUS_CERTIFICATION' = 'AI_ONLY';
    if (metadata.serviceType === 'certification') {
      reviewType = 'CERTIFICATION';
    } else if (metadata.serviceType === 'ai_and_certification') {
      reviewType = 'AI_PLUS_CERTIFICATION';
    }

    // Map urgency level to enum (use STANDARD for all since schema doesn't have URGENT/EMERGENCY)
    let urgency: 'STANDARD' | 'EXPRESS' | 'ECONOMY' = 'STANDARD';
    if (metadata.urgencyLevel === 'urgent') {
      urgency = 'EXPRESS';
    } else if (metadata.urgencyLevel === 'emergency') {
      urgency = 'EXPRESS'; // Map emergency to express
    }

    // Get document details for AI review
    const userDocument = await prisma.userDocument.findUnique({
      where: { id: metadata.documentId }
    });

    if (!userDocument) {
      throw new Error('User document not found');
    }

    const documentReview = await prisma.documentReview.create({
      data: {
        userId: payment.userId,
        userDocumentId: metadata.documentId,
        documentSource: 'MARKETPLACE', // or EXTERNAL - schema doesn't have USER_UPLOAD
        documentType: 'USER_DOCUMENT',
        reviewType,
        urgency,
        status: 'pending_lawyer_assignment',
        price: metadata.pricing.total,
        paymentId: payment.id,
        paidAt: new Date(),
        deadline: deliveryEstimate.estimatedDate,
        estimatedDeliveryDate: deliveryEstimate.estimatedDate,
        uploadedDocumentUrl: userDocument.fileUrl,
        originalFileName: userDocument.title
      }
    });

    console.log('[DocumentPayment] Document review created for payment:', payment.id);

    // Trigger AI review if service includes AI analysis
    if (reviewType === 'AI_ONLY' || reviewType === 'AI_PLUS_CERTIFICATION') {
      console.log('[DocumentPayment] Triggering AI review for:', documentReview.id);
      
      // Trigger asynchronously - don't wait for completion
      reviewDocumentWithAI(
        documentReview.id,
        userDocument.fileUrl,
        userDocument.type || 'GENERAL',
        null
      ).catch(err => console.error('[DocumentPayment] AI review trigger error:', err));
    }

    // Assign lawyer if service includes certification
    if (reviewType === 'CERTIFICATION' || reviewType === 'AI_PLUS_CERTIFICATION') {
      console.log('[DocumentPayment] Assigning lawyer for:', documentReview.id);
      
      // For AI_PLUS_CERTIFICATION, wait for AI review to complete before assigning lawyer
      if (reviewType === 'AI_PLUS_CERTIFICATION') {
        // Lawyer will be assigned after AI review completes
        console.log('[DocumentPayment] Lawyer assignment will occur after AI review completion');
      } else {
        // Immediate lawyer assignment for CERTIFICATION only
        assignLawyerToDocumentReview(documentReview.id)
          .catch(err => console.error('[DocumentPayment] Lawyer assignment error:', err));
      }
    }

    console.log('[DocumentPayment] Post-payment workflow initiated successfully');
  } catch (error: any) {
    console.error('[DocumentPayment] Failed to create document review:', error);
  }
}

/**
 * POST /api/document-payment/:paymentId/simulate-callback (DEV ONLY)
 * Simulate M-Pesa callback for testing in sandbox mode
 */
router.post('/:paymentId/simulate-callback', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      res.status(403).json({ error: 'This endpoint is only available in development' });
      return;
    }

    const { paymentId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    if (payment.status !== 'PENDING') {
      res.status(400).json({ error: 'Payment is not pending' });
      return;
    }

    // Mark payment as completed
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        verifiedAt: new Date(),
        metadata: {
          ...(payment.metadata as any),
          mpesaReceiptNumber: `TEST_${Date.now()}`,
          simulatedCallback: true
        } as any
      }
    });

    // Create document review request
    await createDocumentReviewRequest(payment);

    res.json({
      success: true,
      message: 'Payment marked as completed and document review initiated',
      data: { paymentId }
    });
  } catch (error: any) {
    console.error('Simulate callback error:', error);
    res.status(500).json({ error: error.message || 'Failed to simulate callback' });
  }
});

/**
 * POST /api/document-payment/:paymentId/manual-complete
 * Manually complete payment (works in production, requires payment owner auth)
 */
router.post('/:paymentId/manual-complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId } = req.params;
    const userId = req.user?.id;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true }
    });

    if (!payment) {
      res.status(404).json({ error: 'Payment not found' });
      return;
    }

    // Only allow payment owner to complete
    if (payment.userId !== userId) {
      res.status(403).json({ error: 'Not authorized to complete this payment' });
      return;
    }

    if (payment.status !== 'PENDING') {
      res.status(400).json({ 
        error: `Payment is already ${payment.status}`,
        currentStatus: payment.status 
      });
      return;
    }

    console.log(`[ManualComplete] Completing payment ${paymentId} for user ${userId}`);

    // Mark payment as completed
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'PAID',
        verifiedAt: new Date(),
        metadata: {
          ...(payment.metadata as any),
          mpesaReceiptNumber: `MANUAL_${Date.now()}`,
          manualCompletion: true,
          completedBy: userId,
          completedAt: new Date().toISOString()
        } as any
      }
    });

    console.log(`[ManualComplete] Payment marked as PAID, initiating document review...`);

    // Create document review request (triggers AI + lawyer assignment)
    await createDocumentReviewRequest(payment);

    console.log(`[ManualComplete] Document review workflow initiated successfully`);

    res.json({
      success: true,
      message: 'Payment completed and document review workflow initiated',
      data: { 
        paymentId,
        status: 'PAID',
        workflowInitiated: true
      }
    });
  } catch (error: any) {
    console.error('[ManualComplete] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to complete payment' });
  }
});

export default router;
