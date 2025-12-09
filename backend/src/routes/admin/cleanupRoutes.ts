import { Router, Response } from 'express';
import { AuthRequest } from '../../types/auth';
import {
  removeDuplicates,
  removeJunkDocuments,
  removeZeroVectorDocuments,
  fullCleanup
} from '../../controllers/cleanupController';
import { authenticateToken, authorizeRoles } from '../../middleware/auth';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN', 'ADMIN'));

/**
 * @route   DELETE /api/admin/cleanup/duplicates
 * @desc    Remove duplicate legal documents (keep best one)
 * @access  Admin only
 */
router.delete('/duplicates', removeDuplicates);

/**
 * @route   DELETE /api/admin/cleanup/junk
 * @desc    Remove junk/non-legal documents (navigation pages, etc.)
 * @access  Admin only
 */
router.delete('/junk', removeJunkDocuments);

/**
 * @route   DELETE /api/admin/cleanup/zero-vectors
 * @desc    Remove documents with 0 vectors (failed ingestion)
 * @access  Admin only
 */
router.delete('/zero-vectors', removeZeroVectorDocuments);

/**
 * @route   DELETE /api/admin/cleanup/all
 * @desc    Full cleanup: duplicates + junk + zero vectors
 * @access  Admin only
 */
router.delete('/all', fullCleanup);

export default router;

