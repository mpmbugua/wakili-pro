import express from 'express';
import multer from 'multer';
import {
  uploadDocument,
  getDocuments,
  getDocument,
  updateDocumentMetadata,
  deleteUserDocument,
  requestReview,
} from '../controllers/userDocumentController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
});

// All routes require authentication
router.use(authenticateToken);

// Upload a new document
router.post('/upload', upload.single('document'), uploadDocument);

// Get all user documents
router.get('/', getDocuments);

// Get a single document
router.get('/:id', getDocument);

// Update document metadata
router.patch('/:id', updateDocumentMetadata);

// Delete a document
router.delete('/:id', deleteUserDocument);

// Request review for a document
router.post('/:id/request-review', requestReview);

export default router;
