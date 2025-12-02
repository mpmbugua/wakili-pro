import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { documentIngestionService } from '../services/ai/documentIngestionService';

// Configure multer for document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'storage', 'legal-materials');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.docx', '.doc', '.html'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOCX, and HTML files are allowed.'));
    }
  }
});

/**
 * Upload and ingest legal document
 * POST /api/ai/documents/upload
 */
export const uploadLegalDocument = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const {
      title,
      documentType = 'LEGISLATION',
      category = 'General',
      citation,
      sourceUrl,
      effectiveDate
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Document title is required' });
    }

    logger.info(`[AI] Uploading legal document: ${title}`);

    // Ingest the document (extract text, chunk, embed, store in Pinecone)
    const ingestionResult = await documentIngestionService.ingestDocumentFile(
      req.file.path,
      {
        title,
        documentType,
        category,
        citation,
        sourceUrl,
        uploadedBy: userId
      }
    );

    // Store document metadata in database
    const document = await prisma.legalDocument.create({
      data: {
        title,
        documentType,
        category,
        citation,
        sourceUrl,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        filePath: req.file.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        chunksCount: ingestionResult.chunksProcessed,
        vectorsCount: ingestionResult.vectorsStored,
        uploadedBy: userId
      }
    });

    logger.info(`[AI] Document uploaded successfully: ${document.id}`);

    return res.json({
      success: true,
      message: 'Document uploaded and indexed successfully',
      data: {
        documentId: document.id,
        title: document.title,
        chunksProcessed: ingestionResult.chunksProcessed,
        vectorsStored: ingestionResult.vectorsStored
      }
    });
  } catch (error: any) {
    logger.error('[AI] Error uploading legal document:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to upload document',
      error: error.message
    });
  }
};

/**
 * Get all indexed documents
 * GET /api/ai/documents
 */
export const getIndexedDocuments = async (req: Request, res: Response) => {
  try {
    const documents = await prisma.legalDocument.findMany({
      orderBy: { uploadedAt: 'desc' },
      include: {
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    const formattedDocuments = documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      documentType: doc.documentType,
      category: doc.category,
      citation: doc.citation,
      sourceUrl: doc.sourceUrl,
      effectiveDate: doc.effectiveDate,
      chunksCount: doc.chunksCount,
      vectorsCount: doc.vectorsCount,
      uploadedAt: doc.uploadedAt,
      uploadedBy: `${doc.uploader.firstName} ${doc.uploader.lastName}`
    }));

    return res.json({
      success: true,
      data: {
        documents: formattedDocuments,
        total: formattedDocuments.length
      }
    });
  } catch (error: any) {
    logger.error('[AI] Error fetching documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch documents',
      error: error.message
    });
  }
};

/**
 * Get ingestion statistics
 * GET /api/ai/documents/stats
 */
export const getIngestionStats = async (req: Request, res: Response) => {
  try {
    const stats = await prisma.legalDocument.aggregate({
      _count: { id: true },
      _sum: { chunksCount: true, vectorsCount: true }
    });

    const lastDocument = await prisma.legalDocument.findFirst({
      orderBy: { uploadedAt: 'desc' },
      select: { uploadedAt: true }
    });

    return res.json({
      success: true,
      data: {
        totalDocuments: stats._count.id || 0,
        totalChunks: stats._sum.chunksCount || 0,
        totalVectors: stats._sum.vectorsCount || 0,
        lastUpdated: lastDocument?.uploadedAt || new Date()
      }
    });
  } catch (error: any) {
    logger.error('[AI] Error fetching stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

/**
 * Delete a legal document
 * DELETE /api/ai/documents/:id
 */
export const deleteLegalDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const document = await prisma.legalDocument.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    // Delete file from storage
    if (document.filePath && fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // TODO: Delete vectors from Pinecone
    // This would require storing vector IDs or using metadata filtering
    logger.warn(`[AI] Pinecone vector deletion not implemented for document ${id}`);

    // Delete from database
    await prisma.legalDocument.delete({
      where: { id }
    });

    logger.info(`[AI] Document deleted: ${id}`);

    return res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error: any) {
    logger.error('[AI] Error deleting document:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete document',
      error: error.message
    });
  }
};

/**
 * Re-index a document (useful if Pinecone index was cleared)
 * POST /api/ai/documents/:id/reindex
 */
export const reindexDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await prisma.legalDocument.findUnique({
      where: { id }
    });

    if (!document) {
      return res.status(404).json({ success: false, message: 'Document not found' });
    }

    if (!document.filePath || !fs.existsSync(document.filePath)) {
      return res.status(400).json({
        success: false,
        message: 'Document file not found. Cannot re-index.'
      });
    }

    logger.info(`[AI] Re-indexing document: ${document.title}`);

    // Re-ingest the document
    const ingestionResult = await documentIngestionService.ingestDocumentFile(
      document.filePath,
      {
        title: document.title,
        documentType: document.documentType,
        category: document.category,
        citation: document.citation || undefined,
        sourceUrl: document.sourceUrl || undefined,
        uploadedBy: document.uploadedBy
      }
    );

    // Update vector counts
    await prisma.legalDocument.update({
      where: { id },
      data: {
        chunksCount: ingestionResult.chunksProcessed,
        vectorsCount: ingestionResult.vectorsStored
      }
    });

    return res.json({
      success: true,
      message: 'Document re-indexed successfully',
      data: {
        chunksProcessed: ingestionResult.chunksProcessed,
        vectorsStored: ingestionResult.vectorsStored
      }
    });
  } catch (error: any) {
    logger.error('[AI] Error re-indexing document:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to re-index document',
      error: error.message
    });
  }
};
