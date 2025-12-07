import { Router } from 'express';
import { submitContactForm } from '../controllers/contactController';

const router = Router();

/**
 * Submit contact form
 * POST /api/contact
 * Body: { name, email, phone, subject, message }
 * Public route - no authentication required
 */
router.post('/', submitContactForm);

export default router;
