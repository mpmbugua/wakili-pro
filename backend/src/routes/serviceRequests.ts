import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  createServiceRequest,
  getServiceRequest,
  getMyRequests,
  getAvailableRequests,
  submitQuote,
  selectLawyer,
  markComplete,
  confirmComplete
} from '../controllers/serviceRequestController';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// Client routes
router.post('/', createServiceRequest); // Create new service request
router.get('/my-requests', getMyRequests); // Get client's own requests
router.post('/:id/select-lawyer', selectLawyer); // Select lawyer from quotes
router.patch('/:id/confirm-complete', confirmComplete); // Confirm completion and rate

// Lawyer routes
router.get('/available', getAvailableRequests); // Get available requests (tier-filtered)
router.post('/:id/quotes', submitQuote); // Submit quote with connection fee
router.patch('/:id/mark-complete', markComplete); // Mark service as complete

// Shared routes
router.get('/:id', getServiceRequest); // Get request details

export default router;
