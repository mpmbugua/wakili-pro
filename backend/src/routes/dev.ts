import express from 'express';
import { authenticateToken } from '../middleware/auth';
import * as devController from '../controllers/devController';

const router = express.Router();

// Development utilities - Only available in dev mode
router.post('/seed-wallet', authenticateToken, devController.seedWallet);

export default router;
