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
import {
  getLawyerAvailableSlots,
  getLawyerAvailableSlotsRange,
  blockSlot,
  unblockSlot,
  getMyBlockedSlots,
} from '../controllers/availabilityController';
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
 * @route   POST /api/lawyers/availability/block
 * @desc    Block a time slot (lawyer only)
 * @access  Private (Lawyer)
 * @body    { start: ISO datetime, end: ISO datetime, reason?: string }
 */
router.post('/availability/block', authenticateToken, authorizeRoles('LAWYER'), blockSlot);

/**
 * @route   GET /api/lawyers/availability/blocked
 * @desc    Get all blocked slots for current lawyer
 * @access  Private (Lawyer)
 */
router.get('/availability/blocked', authenticateToken, authorizeRoles('LAWYER'), getMyBlockedSlots);

/**
 * @route   DELETE /api/lawyers/availability/:blockedSlotId
 * @desc    Unblock a time slot (lawyer only)
 * @access  Private (Lawyer)
 */
router.delete('/availability/:blockedSlotId', authenticateToken, authorizeRoles('LAWYER'), unblockSlot);

/**
 * @route   GET /api/lawyers/:lawyerId/available-slots
 * @desc    Get available time slots for a lawyer on a specific date
 * @access  Public
 * @query   date (YYYY-MM-DD), duration (optional, default 60 minutes)
 */
router.get('/:lawyerId/available-slots', getLawyerAvailableSlots);

/**
 * @route   GET /api/lawyers/:lawyerId/available-slots/range
 * @desc    Get available time slots for a date range
 * @access  Public
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), duration (optional)
 */
router.get('/:lawyerId/available-slots/range', getLawyerAvailableSlotsRange);

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