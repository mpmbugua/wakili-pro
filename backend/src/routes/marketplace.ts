import express from 'express';
import {
  createService,
  getMyServices,
  updateService,
  deleteService,
  searchServices,
  getService,
  createBooking,
  getMyBookings,
  updateBookingStatus,
  createReview,
  getServiceReviews
} from '../controllers/marketplaceController';
import { authenticateToken } from '../middleware/auth';
import { authorizeRoles } from '../middleware/auth';

const router = express.Router();

// Service routes
router.post('/services', authenticateToken, authorizeRoles('LAWYER'), createService);
router.get('/my-services', authenticateToken, authorizeRoles('LAWYER'), getMyServices);
router.put('/services/:id', authenticateToken, authorizeRoles('LAWYER'), updateService);
router.delete('/services/:id', authenticateToken, authorizeRoles('LAWYER'), deleteService);

// Public service routes
router.get('/services/search', searchServices);
router.get('/services/:id', getService);

// Booking routes
router.post('/bookings', authenticateToken, createBooking);
router.get('/my-bookings', authenticateToken, getMyBookings);
router.put('/bookings/:id/status', authenticateToken, authorizeRoles('LAWYER'), updateBookingStatus);

// Review routes
router.post('/reviews', authenticateToken, createReview);
router.get('/services/:id/reviews', getServiceReviews);

export default router;