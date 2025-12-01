import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { mpesaService } from '../services/mpesaDarajaService';
import { processDocumentGeneration } from '../services/documentGenerationService';

/**
 * Initiate M-Pesa payment for marketplace document
 */
export async function initiateMarketplacePayment(req: AuthenticatedRequest, res: Response) {
  try {
    const { purchaseId, phoneNumber } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!purchaseId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: purchaseId, phoneNumber'
      });
    }

    // Get purchase record
    const purchase = await prisma.documentPurchase.findUnique({
      where: { id: purchaseId },
      include: {
        DocumentTemplate: true
      }
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    if (purchase.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (purchase.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Payment already completed' });
    }

    // Initiate M-Pesa STK Push
    const mpesaResponse = await mpesaService.initiateSTKPush({
      phoneNumber,
      amount: purchase.amount,
      accountReference: `DOC-${purchaseId.substring(0, 8)}`,
      transactionDesc: `Document: ${purchase.description || 'Legal Template'}`
    });

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        userId,
        amount: purchase.amount,
        currency: 'KES',
        status: 'PENDING',
        provider: 'MPESA',
        paymentMethod: 'MPESA',
        phoneNumber,
        mpesaCheckoutRequestId: mpesaResponse.CheckoutRequestID,
        mpesaMerchantRequestId: mpesaResponse.MerchantRequestID,
        metadata: JSON.stringify({
          purchaseId,
          documentId: purchase.documentId,
          type: 'marketplace_document'
        })
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        paymentId: payment.id,
        customerMessage: mpesaResponse.CustomerMessage,
        checkoutRequestID: mpesaResponse.CheckoutRequestID
      },
      message: 'M-Pesa payment initiated. Please enter your PIN.'
    });
  } catch (error) {
    logger.error('Marketplace payment initiation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate payment',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * M-Pesa callback handler for marketplace documents
 */
export async function handleMarketplacePaymentCallback(req: AuthenticatedRequest, res: Response) {
  try {
    const callbackData = req.body;
    logger.info('M-Pesa marketplace callback received:', JSON.stringify(callbackData));

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc } = callbackData.Body.stkCallback;

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        mpesaCheckoutRequestId: CheckoutRequestID,
        mpesaMerchantRequestId: MerchantRequestID
      }
    });

    if (!payment) {
      logger.warn('Payment not found for callback:', CheckoutRequestID);
      return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }

    if (ResultCode === 0) {
      // Payment successful
      const metadata = JSON.parse(payment.metadata as string);
      const { purchaseId, documentId } = metadata;

      // Extract M-Pesa receipt number
      let mpesaReceiptNumber = '';
      if (callbackData.Body.stkCallback.CallbackMetadata) {
        const items = callbackData.Body.stkCallback.CallbackMetadata.Item;
        const receiptItem = items.find((item: any) => item.Name === 'MpesaReceiptNumber');
        if (receiptItem) {
          mpesaReceiptNumber = receiptItem.Value;
        }
      }

      // Update payment record
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          mpesaReceiptNumber,
          completedAt: new Date()
        }
      });

      // Get purchase details
      const purchase = await prisma.documentPurchase.findUnique({
        where: { id: purchaseId },
        include: {
          DocumentTemplate: true
        }
      });

      if (purchase) {
        // Generate the document
        try {
          await processDocumentGeneration(
            purchaseId,
            documentId,
            purchase.description || 'Legal Document',
            {} // User input can be added later
          );
          logger.info(`Document generated successfully for purchase: ${purchaseId}`);
        } catch (genError) {
          logger.error('Document generation error:', genError);
          // Continue even if generation fails - we can retry later
        }
      }

      logger.info(`Marketplace payment completed: ${payment.id}`);
    } else {
      // Payment failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          failureReason: ResultDesc
        }
      });

      logger.info(`Marketplace payment failed: ${payment.id} - ${ResultDesc}`);
    }

    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    logger.error('Marketplace payment callback error:', error);
    return res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
}

/**
 * Check marketplace payment status
 */
export async function checkMarketplacePaymentStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { paymentId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    return res.status(200).json({
      success: true,
      data: {
        status: payment.status,
        amount: payment.amount,
        mpesaReceiptNumber: payment.mpesaReceiptNumber
      }
    });
  } catch (error) {
    logger.error('Payment status check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to check payment status'
    });
  }
}

/**
 * Download purchased document
 */
export async function downloadMarketplaceDocument(req: AuthenticatedRequest, res: Response) {
  try {
    const { purchaseId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const purchase = await prisma.documentPurchase.findUnique({
      where: { id: purchaseId }
    });

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    if (purchase.userId !== userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (purchase.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Document not ready. Please complete payment first.' });
    }

    // Get file path
    const path = require('path');
    const fs = require('fs');
    const filePath = path.join(process.cwd(), 'storage', 'documents', purchase.template || '');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'Document file not found' });
    }

    // Send file
    res.download(filePath, purchase.template || 'document.pdf', (err) => {
      if (err) {
        logger.error('Download error:', err);
        res.status(500).json({ success: false, message: 'Download failed' });
      }
    });
  } catch (error) {
    logger.error('Document download error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to download document'
    });
  }
}
