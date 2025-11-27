import { Router } from 'express';
import { initializeAdmin, checkAdmin } from '../controllers/setupController';

const router = Router();

/**
 * @route   POST /api/setup/init-admin
 * @desc    Create admin user if not exists
 * @access  Public (one-time setup)
 */
router.post('/init-admin', initializeAdmin);

/**
 * @route   GET /api/setup/check-admin
 * @desc    Check if admin user exists
 * @access  Public
 */
router.get('/check-admin', checkAdmin);

export default router;
