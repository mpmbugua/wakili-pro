import { Router } from 'express';
import { listDocumentTemplates, generateDocument, purchaseDocument, downloadDocument } from '../controllers/documentMarketplaceController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// List all available document templates
router.get('/templates', authenticateToken, listDocumentTemplates);

// Generate a document from a template (AI-powered)
router.post('/generate', authenticateToken, generateDocument);

// Purchase a generated document
router.post('/purchase', authenticateToken, purchaseDocument);

// Download a purchased document
router.get('/download/:purchaseId', authenticateToken, downloadDocument);

export default router;
