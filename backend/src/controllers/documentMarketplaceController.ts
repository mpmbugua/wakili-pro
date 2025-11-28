import { Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import * as documentMarketplaceService from '../services/documentMarketplaceService';
import { prisma } from '../utils/database';

// List all available document templates
export async function listDocumentTemplates(req: AuthenticatedRequest, res: Response) {
  const templates = await documentMarketplaceService.getAllTemplates();
  res.json({ templates });
}

// Initiate marketplace template purchase (before payment)
export async function initiateMarketplacePurchase(req: AuthenticatedRequest, res: Response) {
  try {
    const { templateId, documentTitle, price } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!templateId || !documentTitle || !price) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: templateId, documentTitle, price' 
      });
    }

    // Try to find the template, if not found create a placeholder
    let template = await prisma.documentTemplate.findUnique({
      where: { id: templateId }
    });

    // If template doesn't exist, create it for marketplace purchase
    if (!template) {
      template = await prisma.documentTemplate.create({
        data: {
          id: templateId,
          type: 'marketplace-template',
          name: documentTitle,
          description: documentTitle,
          template: '',
          consultationId: 'marketplace', // Placeholder
          url: '',
          priceKES: Math.round(price),
          isActive: true,
          isPublic: true
        }
      });
    }

    // Create a pending purchase record
    const purchase = await prisma.documentPurchase.create({
      data: {
        userId,
        documentId: template.id,
        amount: price,
        type: template.type || 'marketplace-template',
        content: '', // Empty content, will be generated after payment
        description: documentTitle,
        template: template.template || '',
        status: 'PENDING', // Will be updated to COMPLETED after payment
        updatedAt: new Date()
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        purchaseId: purchase.id,
        price: purchase.amount,
        paymentRequired: true
      },
      message: 'Purchase initiated. Please complete payment.'
    });
  } catch (error) {
    console.error('Error initiating marketplace purchase:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initiate purchase',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
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
