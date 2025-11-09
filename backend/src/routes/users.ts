import { Router } from 'express';
import { 
  getProfile, 
  updateProfile, 
  lawyerOnboarding, 
  deleteAccount 
} from '../controllers/userController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

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