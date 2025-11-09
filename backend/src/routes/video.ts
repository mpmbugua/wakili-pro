import express from 'express';
import { 
  createVideoConsultation,
  joinVideoConsultation, 
  updateParticipantStatus,
  leaveVideoConsultation,
  getMyVideoConsultations,
  controlMeeting
} from '../controllers/videoController';
import { authenticateToken } from '../middleware/auth';
import { rateLimiter } from '../middleware/rateLimitMiddleware';

const router = express.Router();

// Apply authentication to all video routes
router.use(authenticateToken);

/**
 * @route   POST /api/video/consultations
 * @desc    Create a new video consultation for a booking
 * @access  Private (Client or Lawyer)
 */
router.post('/consultations', rateLimiter, createVideoConsultation);

/**
 * @route   POST /api/video/consultations/:id/join
 * @desc    Join a video consultation
 * @access  Private (Client or Lawyer)
 */
router.post('/consultations/:id/join', rateLimiter, joinVideoConsultation);

/**
 * @route   PATCH /api/video/consultations/:id/participant
 * @desc    Update participant status (audio/video settings, connection status)
 * @access  Private (Participant)
 */
router.patch('/consultations/:id/participant', updateParticipantStatus);

/**
 * @route   POST /api/video/consultations/:id/leave
 * @desc    Leave a video consultation
 * @access  Private (Participant)
 */
router.post('/consultations/:id/leave', leaveVideoConsultation);

/**
 * @route   GET /api/video/consultations
 * @desc    Get user's video consultations (as client or lawyer)
 * @access  Private
 */
router.get('/consultations', getMyVideoConsultations);

/**
 * @route   POST /api/video/consultations/control
 * @desc    Control meeting (end meeting, start/stop recording)
 * @access  Private (Lawyer only)
 */
router.post('/consultations/control', rateLimiter, controlMeeting);

export default router;