import express from 'express';
import { 
  sendVerificationCode, 
  verifyCode, 
  getVerificationStatus 
} from '../controllers/verificationController';
import { authenticateToken } from '../middleware/auth';
import { detectAbusePatterns } from '../middleware/abusePreventionMiddleware';

const router = express.Router();

// All verification routes require authentication
router.use(authenticateToken);

// Send verification code
router.post('/send-code', detectAbusePatterns, sendVerificationCode);

// Verify code
router.post('/verify-code', verifyCode);

// Get verification status
router.get('/status', getVerificationStatus);

export default router;
