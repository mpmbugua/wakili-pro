import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import {
  getLawyerAvailableSlots,
  getLawyerAvailableSlotsRange,
  blockSlot,
  unblockSlot,
  getMyBlockedSlots,
} from '../controllers/availabilityController';

const router = express.Router();

/**
 * @route   GET /api/lawyers/:lawyerId/available-slots
 * @desc    Get available time slots for a lawyer on a specific date
 * @access  Public
 * @query   date (YYYY-MM-DD), duration (optional, default 60 minutes)
 */
router.get('/:lawyerId/available-slots', getLawyerAvailableSlots);

/**
 * @route   GET /api/lawyers/:lawyerId/available-slots/range
 * @desc    Get available time slots for a date range
 * @access  Public
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), duration (optional)
 */
router.get('/:lawyerId/available-slots/range', getLawyerAvailableSlotsRange);

/**
 * @route   POST /api/lawyers/availability/block
 * @desc    Block a time slot (lawyer only)
 * @access  Private (Lawyer)
 * @body    { start: ISO datetime, end: ISO datetime, reason?: string }
 */
router.post(
  '/availability/block',
  authenticateToken,
  authorizeRoles('LAWYER'),
  blockSlot
);

/**
 * @route   DELETE /api/lawyers/availability/:blockedSlotId
 * @desc    Unblock a time slot (lawyer only)
 * @access  Private (Lawyer)
 */
router.delete(
  '/availability/:blockedSlotId',
  authenticateToken,
  authorizeRoles('LAWYER'),
  unblockSlot
);

/**
 * @route   GET /api/lawyers/availability/blocked
 * @desc    Get all blocked slots for current lawyer
 * @access  Private (Lawyer)
 */
router.get(
  '/availability/blocked',
  authenticateToken,
  authorizeRoles('LAWYER'),
  getMyBlockedSlots
);

export default router;
