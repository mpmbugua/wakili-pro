import express from 'express';
import { createConsultation, getMyConsultations } from '../controllers/consultationController';
import { authenticateToken } from '../middleware/auth';

import type { Router as ExpressRouter } from 'express';
const router: ExpressRouter = express.Router();

// Consultation booking routes
router.post('/book', authenticateToken, createConsultation);
router.get('/my-consultations', authenticateToken, getMyConsultations);

export default router;
