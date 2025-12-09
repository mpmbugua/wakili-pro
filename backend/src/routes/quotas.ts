import express from 'express';
import { authenticateToken } from '../middleware/authMiddleware';
import * as quotasController from '../controllers/quotasController';

const router = express.Router();

/**
 * @route GET /api/quotas/status
 * @desc Get current quota status for authenticated lawyer
 * @access Private (Lawyers only)
 */
router.get('/status', authenticateToken, quotasController.getQuotaStatus);

export default router;
