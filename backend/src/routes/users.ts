import { Router } from 'express';
import multer from 'multer';
import { 
  getProfile, 
  updateProfile, 
  lawyerOnboarding, 
  deleteAccount,
  updateNotificationPreferences,
  updatePrivacySettings,
  updateLanguageSettings
} from '../controllers/userController';
import { uploadPhoto } from '../controllers/photoUploadController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

import type { Router as ExpressRouter } from 'express';
const router: ExpressRouter = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', authenticateToken, getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 * @body    { firstName?, lastName?, phoneNumber?, dateOfBirth?, profilePicture? }
 */
router.put('/profile', authenticateToken, updateProfile);

/**
 * @route   PUT /api/users/notification-preferences
 * @desc    Update notification preferences
 * @access  Private
 * @body    { email?, sms?, push?, consultationReminders? }
 */
router.put('/notification-preferences', authenticateToken, updateNotificationPreferences);

/**
 * @route   PUT /api/users/privacy-settings
 * @desc    Update privacy settings
 * @access  Private
 * @body    { profileVisibility?, showActivityStatus?, dataAnalytics? }
 */
router.put('/privacy-settings', authenticateToken, updatePrivacySettings);

/**
 * @route   PUT /api/users/language-settings
 * @desc    Update language and timezone settings
 * @access  Private
 * @body    { language?, timezone? }
 */
router.put('/language-settings', authenticateToken, updateLanguageSettings);

/**
 * @route   POST /api/users/upload-photo
 * @desc    Upload profile photo
 * @access  Private
 */
router.post('/upload-photo', authenticateToken, upload.single('photo'), uploadPhoto);

/**
 * @route   POST /api/users/lawyer-onboarding
 * @desc    Complete lawyer profile setup
 * @access  Private (Lawyer role only)
 * @body    { licenseNumber, yearOfAdmission, specializations, location, bio, yearsOfExperience, profileImageUrl? }
 */
router.post('/lawyer-onboarding', authenticateToken, authorizeRoles('LAWYER'), lawyerOnboarding);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account (soft delete)
 * @access  Private
 * @body    { password }
 */
router.delete('/account', authenticateToken, deleteAccount);

export default router;