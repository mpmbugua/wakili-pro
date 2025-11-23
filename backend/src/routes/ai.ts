import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken, optionalAuth, authorizeRoles } from '../middleware/auth';
import {
  askAIQuestion,
  generateDocument,
  researchLegalTopic,
  analyzeContract,
  getAIQueryHistory,
  getFreeQueryLimit,
  voiceToTextQuery,
  textToSpeechResponse,
  ingestLegalDocument,
  getKnowledgeBase,
  deleteLegalDocument,
  getKnowledgeBaseStats,
  initializeVectorDb
} from '../controllers/aiController';

import type { Router as ExpressRouter } from 'express';
const router: ExpressRouter = Router();

// Configure multer for document uploads (admin knowledge base)
const upload = multer({
  dest: path.join(process.cwd(), 'storage', 'knowledge-base'),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and DOCX files are supported.'));
    }
  }
});

// Configure multer for user query attachments (images + documents)
const userUpload = multer({
  dest: path.join(process.cwd(), 'storage', 'user-uploads'),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx'];
    if (allowed.includes(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Supported: images (JPG, PNG, GIF, WEBP) and documents (PDF, DOC, DOCX).'));
    }
  }
});

// Test endpoint to verify router is loaded
router.get('/test', (_req, res) => {
  res.json({ 
    success: true, 
    message: 'AI router is working',
    endpoints: ['/ask', '/voice-query', '/research', '/generate-document']
  });
});

// Public AI endpoints (with rate limiting for free users)
router.post('/ask', optionalAuth, userUpload.array('attachments', 5), askAIQuestion);
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

// =====================================================
// RAG KNOWLEDGE BASE MANAGEMENT (ADMIN ONLY)
// =====================================================

// Initialize vector database (one-time setup)
router.get('/init-vector-db', authorizeRoles('ADMIN'), initializeVectorDb);

// Upload and ingest legal document
router.post('/ingest-document', authorizeRoles('ADMIN'), upload.single('file'), ingestLegalDocument);

// List knowledge base documents
router.get('/knowledge-base', authorizeRoles('ADMIN'), getKnowledgeBase);

// Get knowledge base statistics
router.get('/knowledge-base/stats', authorizeRoles('ADMIN'), getKnowledgeBaseStats);

// Delete document from knowledge base
router.delete('/document/:documentId', authorizeRoles('ADMIN'), deleteLegalDocument);

export default router;