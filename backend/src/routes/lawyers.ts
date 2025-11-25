import { Router } from 'express';
import multer from 'multer';
import { 
  getLawyerProfile, 
  updateLawyerProfile, 
  updateAvailability,
  getPublicLawyerProfile,
  searchLawyers,
  uploadProfilePhoto
} from '../controllers/lawyerController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

import type { Router as ExpressRouter } from 'express';
const router: ExpressRouter = Router();

// Configure multer for profile photo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'storage/temp');
  },
  filename: (req, file, cb) => {
    cb(null, `temp-${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

/**
 * @route   GET /api/lawyers/profile
 * @desc    Get current lawyer's profile
 * @access  Private (Lawyer role only)
 */
router.get('/profile', authenticateToken, authorizeRoles('LAWYER'), getLawyerProfile);

/**
 * @route   PUT /api/lawyers/profile
 * @desc    Update lawyer profile
 * @access  Private (Lawyer role only)
 * @body    { licenseNumber?, yearOfAdmission?, specializations?, location?, bio?, yearsOfExperience?, profileImageUrl? }
 */
router.put('/profile', authenticateToken, authorizeRoles('LAWYER'), updateLawyerProfile);

/**
 * @route   POST /api/lawyers/profile/upload-photo
 * @desc    Upload lawyer profile photo
 * @access  Private (Lawyer role only)
 */
router.post('/profile/upload-photo', authenticateToken, authorizeRoles('LAWYER'), upload.single('profileImage'), uploadProfilePhoto);

/**
 * @route   PUT /api/lawyers/availability
 * @desc    Update lawyer availability schedule
 * @access  Private (Lawyer role only)
 * @body    { availability: Array<WorkingHours> }
 */
router.put('/availability', authenticateToken, authorizeRoles('LAWYER'), updateAvailability);

/**
 * @route   GET /api/lawyers/:lawyerId
 * @desc    Get public lawyer profile by ID
 * @access  Public
 */
router.get('/:lawyerId', getPublicLawyerProfile);

/**
 * @route   GET /api/lawyers
 * @desc    Search and filter lawyers
 * @access  Public
 * @query   { specialization?, location?, minRating?, maxDistance?, page?, limit? }
 */
router.get('/', searchLawyers);

export default router;