import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from '../middleware/auth';
import {
  uploadSignature,
  uploadStamp,
  updateLetterheadDetails,
  getLetterhead,
  deleteSignature,
  deleteStamp
} from '../controllers/lawyerLetterheadController';

const router = express.Router();

// Configure multer for image uploads
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

export default router;
