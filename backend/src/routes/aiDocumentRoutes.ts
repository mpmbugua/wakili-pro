import { Router } from 'express';
import {
  uploadLegalDocument,
  uploadBulkLegalDocuments,
  uploadFromFolder,
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
 * @desc    Upload and ingest single legal document for AI training
 * @access  Admin only
 */
router.post('/upload', authorizeRoles('ADMIN', 'ADMIN'), upload.single('file'), uploadLegalDocument);

/**
 * @route   POST /api/ai/documents/bulk-upload
 * @desc    Upload and ingest multiple legal documents for AI training
 * @access  Admin only
 */
router.post('/bulk-upload', authorizeRoles('ADMIN', 'ADMIN'), upload.array('files', 50), uploadBulkLegalDocuments);

/**
 * @route   POST /api/ai/documents/folder-upload
 * @desc    Upload and ingest all documents from a folder (recursive)
 * @access  Admin only
 */
router.post('/folder-upload', authorizeRoles('ADMIN', 'ADMIN'), uploadFromFolder);

/**
 * @route   GET /api/ai/documents
 * @desc    Get all indexed legal documents
 * @access  Admin only
 */
router.get('/', authorizeRoles('ADMIN', 'ADMIN'), getIndexedDocuments);

/**
 * @route   GET /api/ai/documents/stats
 * @desc    Get document ingestion statistics
 * @access  Admin only
 */
router.get('/stats', authorizeRoles('ADMIN', 'ADMIN'), getIngestionStats);

/**
 * @route   DELETE /api/ai/documents/:id
 * @desc    Delete a legal document and its vectors
 * @access  Admin only
 */
router.delete('/:id', authorizeRoles('ADMIN', 'ADMIN'), deleteLegalDocument);

/**
 * @route   POST /api/ai/documents/:id/reindex
 * @desc    Re-index a document (if Pinecone index was cleared)
 * @access  Admin only
 */
router.post('/:id/reindex', authorizeRoles('ADMIN', 'ADMIN'), reindexDocument);

export default router;

