import { Router } from 'express';
import {
  uploadLegalDocument,
  getIndexedDocuments,
  getIngestionStats,
  deleteLegalDocument,
  reindexDocument,
  upload
} from '../controllers/aiDocumentController';
import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/ai/documents/upload
 * @desc    Upload and ingest legal document for AI training
 * @access  Admin only
 */
router.post('/upload', authorizeRoles('ADMIN', 'SUPER_ADMIN'), upload.single('file'), uploadLegalDocument);

/**
 * @route   GET /api/ai/documents
 * @desc    Get all indexed legal documents
 * @access  Admin only
 */
router.get('/', authorizeRoles('ADMIN', 'SUPER_ADMIN'), getIndexedDocuments);

/**
 * @route   GET /api/ai/documents/stats
 * @desc    Get document ingestion statistics
 * @access  Admin only
 */
router.get('/stats', authorizeRoles('ADMIN', 'SUPER_ADMIN'), getIngestionStats);

/**
 * @route   DELETE /api/ai/documents/:id
 * @desc    Delete a legal document and its vectors
 * @access  Admin only
 */
router.delete('/:id', authorizeRoles('ADMIN', 'SUPER_ADMIN'), deleteLegalDocument);

/**
 * @route   POST /api/ai/documents/:id/reindex
 * @desc    Re-index a document (if Pinecone index was cleared)
 * @access  Admin only
 */
router.post('/:id/reindex', authorizeRoles('ADMIN', 'SUPER_ADMIN'), reindexDocument);

export default router;
