import express from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth';
import {
  uploadSignature,
  uploadStamp,
  uploadLetterheadTemplate,
  updateLetterheadDetails,
  updateLetterheadPreference,
  getLetterhead,
  deleteSignature,
  deleteStamp,
  deleteLetterheadTemplate
} from '../controllers/lawyerLetterheadController';

const router = express.Router();

// Configure multer for image uploads (memory storage for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only PNG and JPG images
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PNG and JPG images are allowed.'));
    }
  }
});

// Configure multer for letterhead template uploads (PDF or images)
const letterheadUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for letterheads
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF and images
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, and JPG files are allowed.'));
    }
  }
});

/**
 * @route POST /api/lawyer/letterhead/signature
 * @desc Upload digital signature
 * @access Private (Lawyers only)
 */
router.post(
  '/signature',
  authenticateToken,
  upload.single('signature'),
  uploadSignature
);

/**
 * @route POST /api/lawyer/letterhead/stamp
 * @desc Upload digital stamp
 * @access Private (Lawyers only)
 */
router.post(
  '/stamp',
  authenticateToken,
  upload.single('stamp'),
  uploadStamp
);

/**
 * @route PUT /api/lawyer/letterhead/details
 * @desc Update letterhead details (firm info)
 * @access Private (Lawyers only)
 */
router.put(
  '/details',
  authenticateToken,
  updateLetterheadDetails
);

/**
 * @route PUT /api/lawyer/letterhead/preference
 * @desc Update letterhead preference (system-generated vs custom)
 * @access Private (Lawyers only)
 */
router.put(
  '/preference',
  authenticateToken,
  updateLetterheadPreference
);

/**
 * @route GET /api/lawyer/letterhead
 * @desc Get lawyer's letterhead
 * @access Private (Lawyers only)
 */
router.get(
  '/',
  authenticateToken,
  getLetterhead
);

/**
 * @route DELETE /api/lawyer/letterhead/signature
 * @desc Delete digital signature
 * @access Private (Lawyers only)
 */
router.delete(
  '/signature',
  authenticateToken,
  deleteSignature
);

/**
 * @route DELETE /api/lawyer/letterhead/stamp
 * @desc Delete digital stamp
 * @access Private (Lawyers only)
 */
router.delete(
  '/stamp',
  authenticateToken,
  deleteStamp
);

/**
 * @route POST /api/lawyer/letterhead/template
 * @desc Upload letterhead template (PDF or image with header/footer)
 * @access Private (Lawyers only)
 */
router.post(
  '/template',
  authenticateToken,
  letterheadUpload.single('letterhead'),
  uploadLetterheadTemplate
);

/**
 * @route DELETE /api/lawyer/letterhead/template
 * @desc Delete letterhead template
 * @access Private (Lawyers only)
 */
router.delete(
  '/template',
  authenticateToken,
  deleteLetterheadTemplate
);

export default router;
