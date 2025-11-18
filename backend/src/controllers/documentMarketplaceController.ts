import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import * as documentMarketplaceService from '../services/documentMarketplaceService';

// List all available document templates
export async function listDocumentTemplates(req: AuthenticatedRequest, res: Response) {
  const templates = await documentMarketplaceService.getAllTemplates();
  res.json({ templates });
}

// Generate a document from a template (AI-powered)
export async function generateDocument(req: AuthenticatedRequest, res: Response) {
  const { templateId, userInput } = req.body;
  const result = await documentMarketplaceService.generateDocument(templateId, userInput, req.user.id);
  res.json(result);
}

// Purchase a generated document
export async function purchaseDocument(req: AuthenticatedRequest, res: Response) {
  const { documentId } = req.body;
  const purchase = await documentMarketplaceService.purchaseDocument(documentId, req.user.id);
  res.json(purchase);
}

// Download a purchased document
import fs from 'fs';
import path from 'path';

export async function downloadDocument(req: AuthenticatedRequest, res: Response) {
  const { purchaseId } = req.params;
  try {
    const file = await documentMarketplaceService.downloadDocument(purchaseId, req.user.id);
    const filePath = path.resolve(file.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => {
      res.status(500).json({ error: 'Error reading file' });
    });
    stream.pipe(res);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
