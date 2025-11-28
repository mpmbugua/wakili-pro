import { Router } from 'express';
import { listDocumentTemplates, generateDocument, purchaseDocument, downloadDocument, initiateMarketplacePurchase } from '../controllers/documentMarketplaceController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = Router();

// List all available document templates (public)
router.get('/templates', listDocumentTemplates);

// Generate a document from a template (AI-powered) - requires auth
router.post('/generate', authenticateToken, generateDocument);

// Initiate marketplace template purchase (creates purchase record before payment)
router.post('/marketplace/purchase', authenticateToken, initiateMarketplacePurchase);

// Purchase a generated document
router.post('/purchase', authenticateToken, purchaseDocument);

// Download a purchased document
router.get('/download/:purchaseId', authenticateToken, downloadDocument);

export default router;
