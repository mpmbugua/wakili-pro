import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  certifyDocument,
  getCertificationQueue,
  verifyCertificate
} from '../controllers/documentCertificationController';

const router = express.Router();

/**
 * @route POST /api/certification/certify
 * @desc Apply digital signature and stamp to document
 * @access Private (Lawyers only)
 */
router.post(
  '/certify',
  authenticateToken,
  certifyDocument
);

/**
 * @route GET /api/certification/queue
 * @desc Get lawyer's certification queue
 * @access Private (Lawyers only)
 */
router.get(
  '/queue',
  authenticateToken,
  getCertificationQueue
);

/**
 * @route GET /api/certification/verify/:certificateId
 * @desc Verify certificate (public endpoint)
 * @access Public
 */
router.get(
  '/verify/:certificateId',
  verifyCertificate
);

export default router;
