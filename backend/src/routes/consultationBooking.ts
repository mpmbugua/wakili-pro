import express from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createBooking,
  getBooking,
  getMyBookings,
  confirmSession,
  cancelBookingEndpoint,
  rescheduleBookingEndpoint,
  confirmPayment,
} from '../controllers/consultationBookingController';

const router = express.Router();

/**
 * @route   POST /api/consultations/create
 * @desc    Create a new consultation booking
 * @access  Private (authenticated users)
 * @body    { lawyerId, consultationType, scheduledStart, scheduledEnd, description, phoneNumber }
 */
router.post('/create', authenticateToken, createBooking);

/**
 * @route   GET /api/consultations/my-bookings
 * @desc    Get all bookings for current user
 * @access  Private (authenticated users)
 * @query   status (optional), upcoming (optional)
 */
router.get('/my-bookings', authenticateToken, getMyBookings);

/**
 * @route   GET /api/consultations/:id
 * @desc    Get booking details by ID
 * @access  Private (authenticated users - client or lawyer)
 */
router.get('/:id', authenticateToken, getBooking);

/**
 * @route   PATCH /api/consultations/:id/confirm
 * @desc    Confirm session completion
 * @access  Private (authenticated users - client or lawyer)
 * @body    { confirmedBy: 'CLIENT' | 'LAWYER' }
 */
router.patch('/:id/confirm', authenticateToken, confirmSession);

/**
 * @route   PATCH /api/consultations/:id/cancel
 * @desc    Cancel a booking
 * @access  Private (authenticated users - client or lawyer)
 * @body    { reason?: string }
 */
router.patch('/:id/cancel', authenticateToken, cancelBookingEndpoint);

/**
 * @route   PATCH /api/consultations/:id/reschedule
 * @desc    Reschedule a booking
 * @access  Private (authenticated users - client only)
 * @body    { scheduledStart, scheduledEnd }
 */
router.patch('/:id/reschedule', authenticateToken, rescheduleBookingEndpoint);

/**
 * @route   POST /api/consultations/:id/payment-confirm
 * @desc    Confirm booking payment (internal use, called by M-Pesa callback)
 * @access  Private
 * @body    { paymentId }
 */
router.post('/:id/payment-confirm', confirmPayment);

export default router;
