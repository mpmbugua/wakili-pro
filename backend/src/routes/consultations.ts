import express from 'express';
import { 
  createConsultation, 
  getMyConsultations,
  confirmConsultation,
  rejectConsultation,
  requestReschedule
} from '../controllers/consultationController';
import {
  createBooking,
  getBooking,
  getMyBookings,
  confirmSession,
  cancelBookingEndpoint,
  rescheduleBookingEndpoint,
  confirmPayment,
} from '../controllers/consultationBookingController';
import { authenticateToken } from '../middleware/auth';

import type { Router as ExpressRouter } from 'express';
const router: ExpressRouter = express.Router();

// Legacy routes (keep for backwards compatibility)
router.post('/book', authenticateToken, createConsultation);
router.get('/my-consultations', authenticateToken, getMyConsultations);

// New comprehensive booking routes
/**
 * @route   POST /api/consultations/create
 * @desc    Create a new consultation booking with M-Pesa payment
 * @access  Private (authenticated users)
 */
router.post('/create', authenticateToken, createBooking);

/**
 * @route   GET /api/consultations/my-bookings
 * @desc    Get all bookings for current user (client or lawyer)
 * @access  Private (authenticated users)
 */
router.get('/my-bookings', authenticateToken, getMyBookings);

/**
 * @route   GET /api/consultations/:id
 * @desc    Get booking details by ID
 * @access  Private (authenticated users)
 */
router.get('/:id', authenticateToken, getBooking);

/**
 * @route   PATCH /api/consultations/:id/confirm
 * @desc    Confirm session completion
 * @access  Private (authenticated users)
 */
router.patch('/:id/confirm', authenticateToken, confirmSession);

/**
 * @route   POST /api/consultations/:id/lawyer-confirm
 * @desc    Lawyer confirms a pending consultation booking
 * @access  Private (lawyer only)
 */
router.post('/:id/lawyer-confirm', authenticateToken, confirmConsultation);

/**
 * @route   POST /api/consultations/:id/lawyer-reject
 * @desc    Lawyer rejects a pending consultation booking
 * @access  Private (lawyer only)
 */
router.post('/:id/lawyer-reject', authenticateToken, rejectConsultation);

/**
 * @route   POST /api/consultations/:id/lawyer-reschedule
 * @desc    Lawyer requests to reschedule a consultation
 * @access  Private (lawyer only)
 */
router.post('/:id/lawyer-reschedule', authenticateToken, requestReschedule);

/**
 * @route   PATCH /api/consultations/:id/cancel
 * @desc    Cancel a booking
 * @access  Private (authenticated users)
 */
router.patch('/:id/cancel', authenticateToken, cancelBookingEndpoint);

/**
 * @route   PATCH /api/consultations/:id/reschedule
 * @desc    Reschedule a booking
 * @access  Private (authenticated users - client only)
 */
router.patch('/:id/reschedule', authenticateToken, rescheduleBookingEndpoint);

/**
 * @route   POST /api/consultations/:id/payment-confirm
 * @desc    Confirm booking payment (internal, called by M-Pesa callback)
 * @access  Private
 */
router.post('/:id/payment-confirm', confirmPayment);

export default router;
