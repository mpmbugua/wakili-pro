import { Request, Response } from 'express';
import { prisma } from '../utils/database';
import { mpesaService } from '../services/mpesaDarajaService';
import { logger } from '../utils/logger';
import { sendPaymentConfirmationEmail } from '../services/emailTemplates';
import { sendSMS } from '../services/smsService';
import { processDocumentGeneration } from '../services/documentGenerationService';

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
    const { phoneNumber, amount, bookingId, reviewId, purchaseId, subscriptionId, serviceRequestId, quoteId, paymentType } = req.body;
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

    // Validate booking, review, purchase, subscription, or service request exists
    let targetId: string;
    let accountReference: string;
    let transactionDesc: string;
    let actualBookingId: string | undefined;
    let resourceType: 'BOOKING' | 'REVIEW' | 'PURCHASE' | 'SUBSCRIPTION' | 'SERVICE_REQUEST_COMMITMENT' | 'SERVICE_REQUEST_PAYMENT';

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
    } else if (serviceRequestId) {
      // Service request payment (commitment fee or agreed fee)
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: serviceRequestId },
      });

      if (!serviceRequest) {
        return res.status(404).json({
          success: false,
          message: 'Service request not found',
        });
      }

      if (serviceRequest.userId !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to pay for this service request',
        });
      }

      targetId = serviceRequestId;
      actualBookingId = null;
      
      // Determine if this is commitment fee or agreed fee payment
      if (amount === 500 || paymentType === 'SERVICE_REQUEST_COMMITMENT') {
        resourceType = 'SERVICE_REQUEST_COMMITMENT';
        accountReference = `SRCOM-${serviceRequestId.substring(0, 8)}`;
        transactionDesc = 'Service Request Commitment Fee';
      } else {
        resourceType = 'SERVICE_REQUEST_PAYMENT';
        accountReference = `SRPAY-${serviceRequestId.substring(0, 8)}`;
        transactionDesc = 'Service Request Payment';
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Either bookingId, purchaseId, reviewId, subscriptionId, or serviceRequestId is required',
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
          resourceType, // 'BOOKING', 'PURCHASE', 'REVIEW', 'SUBSCRIPTION', 'SERVICE_REQUEST_COMMITMENT', or 'SERVICE_REQUEST_PAYMENT'
          paymentType, // Optional: for additional categorization
          purchaseId: purchaseId || null,
          reviewId: reviewId || null,
          subscriptionId: subscriptionId || null,
          serviceRequestId: serviceRequestId || null,
          quoteId: quoteId || null,
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

        // Send payment confirmation notification
        const user = await prisma.user.findUnique({
          where: { id: payment.userId },
        });
        if (user?.email) {
          sendPaymentConfirmationEmail(
            user.email,
            `${user.firstName} ${user.lastName}`,
            {
              bookingId: payment.bookingId,
              amount: payment.amount,
              transactionId: callbackResult.transactionId || payment.id,
              paymentMethod: 'M-Pesa'
            }
          ).catch(err => logger.error('[Payment] Email notification error:', err));
        }
        if (user?.phoneNumber) {
          const smsMessage = `Wakili Pro: Payment of KES ${payment.amount.toLocaleString()} received. Booking confirmed. Ref: ${callbackResult.transactionId}`;
          sendSMS(user.phoneNumber, smsMessage).catch(err => logger.error('[Payment] SMS notification error:', err));
        }
      } else if (metadata?.resourceType === 'PURCHASE' && metadata?.purchaseId) {
        // Get purchase details with document info
        const purchase = await prisma.documentPurchase.findUnique({
          where: { id: metadata.purchaseId },
          include: {
            document: true,
            user: true,
          },
        });

        if (purchase) {
          // Generate document PDF after successful payment
          try {
            logger.info('[Purchase] Triggering document generation:', { purchaseId: metadata.purchaseId });
            await processDocumentGeneration(
              metadata.purchaseId,
              purchase.documentId,
              purchase.document?.title || purchase.description || 'Legal Document',
              {} // User input can be passed here if needed
            );
            logger.info('[Purchase] Document generated successfully');
          } catch (genError) {
            logger.error('[Purchase] Document generation error:', genError);
            // Continue with notifications even if generation fails
          }

          // Update document purchase status
          await prisma.documentPurchase.update({
            where: { id: metadata.purchaseId },
            data: { status: 'COMPLETED' },
          });
          logger.info('Document purchase completed:', { purchaseId: metadata.purchaseId });

          // Send payment confirmation email
          if (purchase.user?.email) {
            const userName = `${purchase.user.firstName} ${purchase.user.lastName}`;
            const documentTitle = purchase.document?.title || purchase.description || 'Legal Document';
            
            sendPaymentConfirmationEmail(
              purchase.user.email,
              userName,
              {
                bookingId: metadata.purchaseId,
                amount: payment.amount,
                transactionId: callbackResult.transactionId || payment.id,
                paymentMethod: 'M-Pesa'
              }
            ).catch(err => logger.error('[Purchase] Email notification error:', err));
          }

          // Send SMS notification with download link
          if (purchase.user?.phoneNumber) {
            const documentTitle = purchase.document?.title || 'document';
            const downloadUrl = `${process.env.FRONTEND_URL}/documents`;
            const smsMessage = `Wakili Pro: "${documentTitle}" purchase confirmed! KES ${payment.amount.toLocaleString()}. Download now: ${downloadUrl} Ref: ${callbackResult.transactionId}`;
            sendSMS(purchase.user.phoneNumber, smsMessage).catch(err => logger.error('[Purchase] SMS notification error:', err));
          }
        }
      } else if (metadata?.resourceType === 'REVIEW' && metadata?.reviewId) {
        // Update document review status
        const docReview = await prisma.documentReview.findUnique({
          where: { id: metadata.reviewId },
          include: { user: true },
        });
        if (docReview) {
          await prisma.documentReview.update({
            where: { id: metadata.reviewId },
            data: { status: 'PAYMENT_VERIFIED' },
          });
          logger.info('Document review payment verified:', { reviewId: metadata.reviewId });

          // Send payment confirmation
          if (docReview.user?.email) {
            sendPaymentConfirmationEmail(
              docReview.user.email,
              `${docReview.user.firstName} ${docReview.user.lastName}`,
              {
                bookingId: metadata.reviewId,
                amount: payment.amount,
                transactionId: callbackResult.transactionId || payment.id,
                paymentMethod: 'M-Pesa'
              }
            ).catch(err => logger.error('[Review] Email notification error:', err));
          }
          if (docReview.user?.phoneNumber) {
            const reviewType = docReview.reviewType === 'AI_ONLY' ? 'AI Review' : 
                              docReview.reviewType === 'CERTIFICATION' ? 'Lawyer Certification' : 'AI + Certification';
            const smsMessage = `Wakili Pro: ${reviewType} payment confirmed! Processing will begin shortly. Delivery within 2 hours. Ref: ${callbackResult.transactionId}`;
            sendSMS(docReview.user.phoneNumber, smsMessage).catch(err => logger.error('[Review] SMS notification error:', err));
          }
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

      } else if (metadata?.resourceType === 'SERVICE_REQUEST_COMMITMENT' && metadata?.serviceRequestId) {
        // Update service request commitment fee status
        const serviceRequest = await prisma.serviceRequest.update({
          where: { id: metadata.serviceRequestId },
          data: { 
            commitmentFeePaid: true,
            status: 'PENDING', // Waiting for lawyer quotes
          },
          include: { user: true },
        });
        logger.info('Service request commitment fee paid:', { serviceRequestId: metadata.serviceRequestId });

        // Send commitment fee confirmation
        if (serviceRequest.user?.email) {
          sendPaymentConfirmationEmail(
            serviceRequest.user.email,
            `${serviceRequest.user.firstName} ${serviceRequest.user.lastName}`,
            {
              bookingId: metadata.serviceRequestId,
              amount: payment.amount,
              transactionId: callbackResult.transactionId || payment.id,
              paymentMethod: 'M-Pesa'
            }
          ).catch(err => logger.error('[ServiceRequest] Email notification error:', err));
        }
        if (serviceRequest.phoneNumber) {
          const smsMessage = `Wakili Pro: Service request submitted! Expect 3 quotes within 24-48 hours. Category: ${serviceRequest.serviceCategory}. Ref: ${callbackResult.transactionId}`;
          sendSMS(serviceRequest.phoneNumber, smsMessage).catch(err => logger.error('[ServiceRequest] SMS notification error:', err));
        }
      } else if (metadata?.resourceType === 'SERVICE_REQUEST_PAYMENT' && metadata?.serviceRequestId && metadata?.quoteId) {
            ).catch(err => logger.error('[Subscription] Email notification error:', err));
          }
          if (subscription.lawyer?.phoneNumber) {
            const tierName = subscription.tier === 'LITE' ? 'LITE (KES 2,999)' : 'PRO (KES 4,999)';
            const smsMessage = `Wakili Pro: ${tierName} subscription activated! Enjoy premium features. Ref: ${callbackResult.transactionId}`;
            sendSMS(subscription.lawyer.phoneNumber, smsMessage).catch(err => logger.error('[Subscription] SMS notification error:', err));
          }
        }
      } else if (metadata?.resourceType === 'SERVICE_REQUEST_COMMITMENT' && metadata?.serviceRequestId) {
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
      } else if (metadata?.resourceType === 'SERVICE_REQUEST_COMMITMENT' && metadata?.serviceRequestId) {
        // Update service request commitment fee status
        await prisma.serviceRequest.update({
          where: { id: metadata.serviceRequestId },
          data: { 
            commitmentFeePaid: true,
            status: 'PENDING', // Waiting for lawyer quotes
          },
        });
        logger.info('Service request commitment fee paid:', { serviceRequestId: metadata.serviceRequestId });
      } else if (metadata?.resourceType === 'SERVICE_REQUEST_PAYMENT' && metadata?.serviceRequestId && metadata?.quoteId) {
        // Handle 30% upfront payment with 20% platform commission and 10% lawyer escrow
        const serviceRequest = await prisma.serviceRequest.findUnique({
          where: { id: metadata.serviceRequestId },
        });

        const quote = await prisma.lawyerQuote.findUnique({
          where: { id: metadata.quoteId },
          include: { 
            lawyer: { 
              include: { 
                lawyerProfile: {
                  include: {
                    wallet: true
                  }
                } 
              } 
            } 
          },
        });

        if (serviceRequest && quote) {
          const paidAmount = payment.amount; // This should be 30% of quoted amount
          const quotedAmount = quote.proposedFee;
          
          // Calculate splits from the 30% payment
          const platformCommission = Math.round(paidAmount * 0.6667); // 20% of total quote (66.67% of 30%)
          const lawyerEscrow = Math.round(paidAmount * 0.3333); // 10% of total quote (33.33% of 30%)
          
          // Update service request status
          await prisma.serviceRequest.update({
            where: { id: metadata.serviceRequestId },
            data: { 
              status: 'IN_PROGRESS',
              selectedLawyerId: quote.lawyerId,
            },
          });

          // Update quote status
          await prisma.lawyerQuote.update({
            where: { id: metadata.quoteId },
            data: { isSelected: true },
          });

          // Credit lawyer escrow (10% to start case) to their wallet
          if (quote.lawyer.lawyerProfile?.wallet) {
            const currentBalance = quote.lawyer.lawyerProfile.wallet.balance;
            const newBalance = Number(currentBalance) + lawyerEscrow;
            
            await prisma.lawyerWallet.update({
              where: { id: quote.lawyer.lawyerProfile.wallet.id },
              data: { 
                balance: newBalance,
                availableBalance: newBalance,
              },
            });
          } else if (quote.lawyer.lawyerProfile) {
            // Create wallet if it doesn't exist
            await prisma.lawyerWallet.create({
              data: {
                lawyerId: quote.lawyer.lawyerProfile.id,
                balance: lawyerEscrow,
                availableBalance: lawyerEscrow,
                currency: 'KES',
          // Send 30% payment confirmation to client
          const client = await prisma.user.findUnique({
            where: { id: serviceRequest.userId },
          });
          if (client?.email) {
            sendPaymentConfirmationEmail(
              client.email,
              `${client.firstName} ${client.lastName}`,
              {
                bookingId: metadata.serviceRequestId,
                amount: payment.amount,
                transactionId: callbackResult.transactionId || payment.id,
                paymentMethod: 'M-Pesa'
              }
            ).catch(err => logger.error('[ServiceRequestPayment] Client email notification error:', err));
          }
          if (serviceRequest.phoneNumber) {
            const smsMessage = `Wakili Pro: 30% payment (KES ${paidAmount.toLocaleString()}) received! Lawyer ${quote.lawyer.firstName} is ready to start your case. Check Messages inbox. Ref: ${callbackResult.transactionId}`;
            sendSMS(serviceRequest.phoneNumber, smsMessage).catch(err => logger.error('[ServiceRequestPayment] Client SMS notification error:', err));
          }

          // Send notification to lawyer about client payment & escrow credit
          if (quote.lawyer?.email) {
            const lawyerName = `${quote.lawyer.firstName} ${quote.lawyer.lastName}`;
            const clientName = client ? `${client.firstName} ${client.lastName}` : 'Client';
            const emailSubject = `New Case Started - KES ${lawyerEscrow.toLocaleString()} Escrow Credited`;
            const emailBody = `
              <h2>Client Selected Your Quote!</h2>
              <p>Dear ${lawyerName},</p>
              <p>Good news! <strong>${clientName}</strong> has paid 30% upfront and selected your quote for their ${serviceRequest.serviceCategory} case.</p>
              <h3>Payment Breakdown:</h3>
              <ul>
                <li><strong>Total Quote:</strong> KES ${quotedAmount.toLocaleString()}</li>
                <li><strong>Client Paid (30%):</strong> KES ${paidAmount.toLocaleString()}</li>
                <li><strong>Your Escrow (10%):</strong> KES ${lawyerEscrow.toLocaleString()} ✅</li>
                <li><strong>Platform Commission (20%):</strong> KES ${platformCommission.toLocaleString()}</li>
                <li><strong>Balance (70%):</strong> KES ${(quotedAmount - paidAmount).toLocaleString()} (to be paid later)</li>
              </ul>
              <p><strong>Next Steps:</strong></p>
              <ol>
                <li>Check your Messages inbox - client is waiting to discuss details</li>
                <li>Confirm timeline: ${quote.proposedTimeline}</li>
                <li>Begin case work using the 10% escrow</li>
                <li>Update client on progress regularly</li>
              </ol>
              <p>Your wallet has been credited KES ${lawyerEscrow.toLocaleString()} to start the case.</p>
            `;
            sendPaymentConfirmationEmail(
              quote.lawyer.email,
              lawyerName,
              {
                bookingId: metadata.quoteId,
                amount: lawyerEscrow,
                transactionId: callbackResult.transactionId || payment.id,
                paymentMethod: 'M-Pesa Escrow'
              }
            ).catch(err => logger.error('[ServiceRequestPayment] Lawyer email notification error:', err));
          }
          if (quote.lawyer?.phoneNumber) {
            const smsMessage = `Wakili Pro: Client selected your quote! KES ${lawyerEscrow.toLocaleString()} escrow credited to wallet. Check Messages to start case. Ref: ${callbackResult.transactionId}`;
            sendSMS(quote.lawyer.phoneNumber, smsMessage).catch(err => logger.error('[ServiceRequestPayment] Lawyer SMS notification error:', err));
          }

          logger.info('Service request payment processed:', { 
            serviceRequestId: metadata.serviceRequestId,
            quoteId: metadata.quoteId,
            quotedAmount,
            paidAmount,
            platformCommission,
            lawyerEscrow,
          });
        }
      }

      logger.info('Payment completed successfully:', {
        paymentId: payment.id,
        transactionId: callbackResult.transactionId,
      });   }
          });

          if (!existingConversation) {
            // Create new conversation
            await prisma.conversation.create({
              data: {
                participants: {
                  create: [
                    { userId: serviceRequest.userId },
                    { userId: quote.lawyerId }
                  ]
                },
                messages: {
                  create: {
                    senderId: quote.lawyerId,
                    content: `Hello! Thank you for selecting my quote. I'm ready to start working on your ${serviceRequest.serviceCategory} case. The estimated timeline is ${quote.proposedTimeline}. Feel free to ask any questions!`,
                    isRead: false
                  }
                }
              }
            });
          }

          logger.info('Service request payment processed:', { 
            serviceRequestId: metadata.serviceRequestId,
            quoteId: metadata.quoteId,
            quotedAmount,
            paidAmount,
            platformCommission,
            lawyerEscrow,
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
