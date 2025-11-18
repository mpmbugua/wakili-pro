import { Router } from 'express';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import {
  askAIQuestion,
  generateDocument,
  researchLegalTopic,
  analyzeContract,
  getAIQueryHistory,
  getFreeQueryLimit,
  voiceToTextQuery,
  textToSpeechResponse
} from '../controllers/aiController';

import type { Router as ExpressRouter } from 'express';
const router: ExpressRouter = Router();

// Public AI endpoints (with rate limiting for free users)
router.post('/ask', optionalAuth, askAIQuestion);
router.post('/voice-query', optionalAuth, voiceToTextQuery);
router.get('/voice-response/:queryId', optionalAuth, textToSpeechResponse);

// Basic legal research (free with limits)
router.post('/research', optionalAuth, researchLegalTopic);

// Premium AI features (require authentication)
router.use(authenticateToken);
router.post('/generate-document', generateDocument);
router.post('/analyze-contract', analyzeContract);
// router.get('/history', getAIQueryHistory); // Disabled: aIQuery model does not exist
router.get('/quota', getFreeQueryLimit);

export default router;