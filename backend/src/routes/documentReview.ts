import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import {
  requestMarketplaceAIReview,
  requestExternalAIReview,
  requestCertification,
  getAIReviewResults,
  getUserDocumentReviews
} from '../controllers/documentReviewController';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../storage/temp'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
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
