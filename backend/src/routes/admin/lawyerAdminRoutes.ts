import { Router } from 'express';
import { 
  getPendingLawyers,
  getVerifiedLawyers,
  approveLawyer,
  rejectLawyer
} from '../../controllers/admin/lawyerAdminController';
import { authenticateToken, authorizeRoles } from '../../middleware/auth';

const router = Router();

// All routes require ADMIN role
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'SUPER_ADMIN'));

/**
 * @route   GET /api/admin/lawyers/pending
 * @desc    Get all pending lawyer applications
 * @access  Admin only
 */
router.get('/pending', getPendingLawyers);

/**
 * @route   GET /api/admin/lawyers/verified
 * @desc    Get all verified lawyers
 * @access  Admin only
 */
router.get('/verified', getVerifiedLawyers);

/**
 * @route   POST /api/admin/lawyers/:lawyerId/approve
 * @desc    Approve a lawyer application
 * @access  Admin only
 */
router.post('/:lawyerId/approve', approveLawyer);

/**
 * @route   POST /api/admin/lawyers/:lawyerId/reject
 * @desc    Reject a lawyer application
 * @access  Admin only
 */
router.post('/:lawyerId/reject', rejectLawyer);

export default router;
