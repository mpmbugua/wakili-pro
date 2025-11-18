import { Router } from 'express';
import { listDocumentTemplates, generateDocument, purchaseDocument, downloadDocument } from '../controllers/documentMarketplaceController';
import { authenticate } from '../middleware/authMiddleware';

const router = Router();

// List all available document templates
router.get('/templates', authenticate, listDocumentTemplates);

// Generate a document from a template (AI-powered)
router.post('/generate', authenticate, generateDocument);

// Purchase a generated document
router.post('/purchase', authenticate, purchaseDocument);

// Download a purchased document
router.get('/download/:purchaseId', authenticate, downloadDocument);

export default router;
