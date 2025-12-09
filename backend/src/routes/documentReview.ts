import express from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';
import { requirePhoneVerification } from '../middleware/requirePhoneVerification';
import { detectAbusePatterns } from '../middleware/abusePreventionMiddleware';
import {
  requestMarketplaceAIReview,
  requestExternalAIReview,
  requestCertification,
  getAIReviewResults,
  getUserDocumentReviews
} from '../controllers/documentReviewController';
import * as quotaService from '../services/quotaService';
import * as analyticsService from '../services/analyticsService';
import { reviewDocumentWithAI } from '../services/documentAIReview';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads (memory storage for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(), // Store in memory for Cloudinary upload
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept common document formats
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/rtf'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, TXT, and RTF files are allowed.'));
    }
  }
});

/**
 * @route POST /api/document-review/create
 * @desc Create document review record (for uploaded user documents)
 * @access Private
 */
router.post('/create', authenticateToken, requirePhoneVerification, detectAbusePatterns, async (req: any, res) => {
  try {
    const userId = req.user?.id;
    const { documentId, reviewType, urgencyLevel } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
    }

    // Verify the document belongs to the user
    const document = await prisma.userDocument.findFirst({
      where: {
        id: documentId,
        userId
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or does not belong to you'
      });
    }

    // Determine pricing based on review type
    const pricing: { [key: string]: number } = {
      'AI_ONLY': 500,
      'CERTIFICATION': 2000,
      'AI_PLUS_CERTIFICATION': 2200
    };

    const amount = pricing[reviewType] || 500;

    // Calculate deadline (2 hours from now for all services)
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + 2);

    // Check for freebies
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        hasUsedFreeReview: true,
        role: true,
        lawyerProfile: {
          select: { tier: true }
        }
      }
    });

    let isFreebie = false;
    let freebieReason = '';

    // Check one-time freebie for regular users (first AI review)
    if (reviewType === 'AI_ONLY' && !user?.hasUsedFreeReview) {
      isFreebie = true;
      freebieReason = 'first_ai_review';
      
      // Mark freebie as used
      await prisma.user.update({
        where: { id: userId },
        data: { hasUsedFreeReview: true }
      });
    }
    // Check lawyer monthly quotas
    else if (user?.role === 'LAWYER' && reviewType === 'AI_ONLY') {
      const allowed = await quotaService.checkAndConsumeAIReview(userId);
      if (allowed) {
        isFreebie = true;
        freebieReason = 'lawyer_quota';
      }
    }

    // Create document review record
    const review = await prisma.documentReview.create({
      data: {
        userId,
        documentSource: 'EXTERNAL', // Use EXTERNAL for user-uploaded documents
        userDocumentId: documentId,
        uploadedDocumentUrl: document.filePath,
        documentType: document.type, // Use document type from UserDocument
        reviewType: reviewType || 'AI_ONLY',
        status: isFreebie ? 'PENDING' : 'PENDING_PAYMENT', // Skip payment for freebies
        urgencyLevel: 'STANDARD', // All services are standard 2-hour delivery
        price: amount, // Add price
        deadline: deadline // Add deadline (2 hours from now)
      }
    });

    // If freebie, process immediately
    if (isFreebie) {
      // Track freebie usage
      await analyticsService.trackFreebieUsage(userId, freebieReason, {
        reviewId: review.id,
        reviewType,
        savings: amount
      });

      // Trigger AI review immediately (asynchronous)
      reviewDocumentWithAI(
        review.id,
        document.filePath,
        document.type,
        null
      ).catch(err => console.error('[DocumentReview] AI review error:', err));

      return res.json({
        success: true,
        message: 'FREE AI review processing! Results ready in 2 hours.',
        data: {
          reviewId: review.id,
          isFreebie: true,
          freebieReason,
          amount: 0,
          savings: amount,
          reviewType: review.reviewType,
          urgencyLevel: review.urgencyLevel,
          status: 'PROCESSING'
        }
      });
    }

    // If not freebie or quota exhausted, check if we should show upgrade prompt
    if (user?.role === 'LAWYER' && reviewType === 'AI_ONLY') {
      const quota = await quotaService.getAIReviewQuota(userId);
      if (quota.remaining === 0) {
        // Track quota exhaustion
        await analyticsService.trackQuotaExhaustion(userId, 'ai_review', quota.tier || 'FREE');
        
        return res.status(402).json({
          success: false,
          message: 'AI review quota exhausted',
          quotaExhausted: true,
          currentTier: quota.tier,
          upgradePrompt: {
            message: `You've used all ${quota.limit} AI reviews this month`,
            upgradeTo: quota.tier === 'FREE' ? 'LITE' : 'PRO',
            upgradeFeatures: quota.tier === 'FREE' 
              ? { aiReviews: 15, pdfDownloads: 10, price: 2999 }
              : { aiReviews: 'unlimited', pdfDownloads: 'unlimited', price: 4999 }
          }
        });
      }
    }

    return res.json({
      success: true,
      data: {
        reviewId: review.id,
        amount,
        reviewType: review.reviewType,
        urgencyLevel: review.urgencyLevel
      }
    });

  } catch (error: any) {
    console.error('Error creating document review:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create document review'
    });
  }
});

/**
 * @route POST /api/document-review/marketplace/ai-review
 * @desc Request FREE AI review for marketplace document
 * @access Private
 */
router.post(
  '/marketplace/ai-review',
  authenticateToken,
  upload.single('document'),
  requestMarketplaceAIReview
);

/**
 * @route POST /api/document-review/external/ai-review
 * @desc Request PAID AI review for external document
 * @access Private
 */
router.post(
  '/external/ai-review',
  authenticateToken,
  upload.single('document'),
  requestExternalAIReview
);

/**
 * @route POST /api/document-review/certification
 * @desc Request document certification (new or upgrade from AI review)
 * @access Private
 */
router.post(
  '/certification',
  authenticateToken,
  upload.single('document'),
  requestCertification
);

/**
 * @route GET /api/document-review/:reviewId
 * @desc Get AI review results
 * @access Private
 */
router.get(
  '/:reviewId',
  authenticateToken,
  getAIReviewResults
);

/**
 * @route GET /api/document-review/user/all
 * @desc Get all document reviews for logged-in user
 * @access Private
 */
router.get(
  '/user/all',
  authenticateToken,
  getUserDocumentReviews
);

export default router;
