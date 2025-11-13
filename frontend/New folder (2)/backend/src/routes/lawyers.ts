import { Router } from 'express';
import { 
  getLawyerProfile, 
  updateLawyerProfile, 
  updateAvailability,
  getPublicLawyerProfile,
  searchLawyers
} from '../controllers/lawyerController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

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