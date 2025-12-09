import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';
import { documentIngestionService } from '../services/ai/documentIngestionService';
import { Pinecone } from '@pinecone-database/pinecone';

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
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB max per file (increased from 20MB)
    files: 50 // Max 50 files per upload
  },
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
 * Infer document type from folder/file name
 */
function inferDocumentType(pathSegment: string): string {
  const normalized = pathSegment.toLowerCase();
  
  if (normalized.includes('constitution')) return 'CONSTITUTION';
  if (normalized.includes('act') || normalized.includes('acts')) return 'ACT';
  if (normalized.includes('regulation') || normalized.includes('regulations')) return 'REGULATION';
  if (normalized.includes('case') || normalized.includes('judgement') || normalized.includes('judgment')) return 'CASE_LAW';
  if (normalized.includes('procedure')) return 'PROCEDURE';
  if (normalized.includes('form')) return 'FORM';
  if (normalized.includes('guideline')) return 'GUIDELINE';
  if (normalized.includes('treaty') || normalized.includes('treaties')) return 'TREATY';
  
  return 'ACT'; // Default fallback
}

/**
 * Infer category from folder structure
 */
function inferCategory(relativePath: string): string {
  const parts = relativePath.split(path.sep);
  
  // Common legal categories
  const categoryMap: Record<string, string> = {
    'constitutional': 'Constitutional Law',
    'criminal': 'Criminal Law',
    'civil': 'Civil Law',
    'commercial': 'Commercial Law',
    'property': 'Property Law',
    'land': 'Property Law',
    'family': 'Family Law',
    'employment': 'Employment Law',
    'labour': 'Employment Law',
    'labor': 'Employment Law',
    'tax': 'Tax Law',
    'taxation': 'Tax Law',
    'corporate': 'Corporate Law',
    'company': 'Corporate Law',
    'banking': 'Banking & Finance',
    'finance': 'Banking & Finance',
    'insurance': 'Insurance Law',
    'intellectual': 'Intellectual Property',
    'ip': 'Intellectual Property',
    'environmental': 'Environmental Law',
    'health': 'Health Law',
    'medical': 'Health Law',
    'education': 'Education Law',
    'immigration': 'Immigration Law',
    'cyber': 'Cyber Law',
    'technology': 'Technology Law',
    'energy': 'Energy Law',
    'mining': 'Mining Law',
    'transport': 'Transport Law',
    'aviation': 'Aviation Law',
    'maritime': 'Maritime Law',
    'agriculture': 'Agriculture Law'
  };
  
  // Check each path segment for category keywords
  for (const part of parts) {
    const normalized = part.toLowerCase();
    for (const [keyword, category] of Object.entries(categoryMap)) {
      if (normalized.includes(keyword)) {
        return category;
      }
    }
  }
  
  // Use first folder as category if no match
  return parts[0] || 'General';
}

/**
 * Extract metadata from filename (e.g., "Land_Act_2012.pdf" -> { effectiveDate: 2012 })
 */
function extractMetadataFromFilename(filename: string): { citation?: string; effectiveDate?: Date } {
  const metadata: { citation?: string; effectiveDate?: Date } = {};
  
  // Extract year from filename (e.g., 2012, 2010)
  const yearMatch = filename.match(/(19|20)\d{2}/);
  if (yearMatch) {
    const year = parseInt(yearMatch[0]);
    metadata.effectiveDate = new Date(`${year}-01-01`);
  }
  
  // Extract citation if present (e.g., [2010] eKLR)
  const citationMatch = filename.match(/\[\d{4}\]\s*\w+/);
  if (citationMatch) {
    metadata.citation = citationMatch[0];
  }
  
  return metadata;
}

/**
 * Recursively find all PDF/DOCX files in a directory
 */
async function findDocumentsInFolder(folderPath: string, basePath: string = folderPath): Promise<Array<{ filePath: string; relativePath: string }>> {
  const results: Array<{ filePath: string; relativePath: string }> = [];
  
  try {
    const entries = await fsPromises.readdir(folderPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(folderPath, entry.name);
      
      if (entry.isDirectory()) {
        // Recursively search subdirectories
        const subResults = await findDocumentsInFolder(fullPath, basePath);
        results.push(...subResults);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (['.pdf', '.docx', '.doc'].includes(ext)) {
          const relativePath = path.relative(basePath, fullPath);
          results.push({ filePath: fullPath, relativePath });
        }
      }
    }
  } catch (error: any) {
    logger.error(`[AI] Error reading folder ${folderPath}:`, error);
  }
  
  return results;
}

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

    // Detect file type from extension
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
    let fileType: 'pdf' | 'docx';
    
    if (fileExtension === 'pdf') {
      fileType = 'pdf';
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      fileType = 'docx';
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Unsupported file type. Only PDF and DOCX files are supported.' 
      });
    }

    // Ingest the document (extract text, chunk, embed, store in Pinecone)
    const ingestionResult = await documentIngestionService.ingestDocumentFile(
      req.file.path,
      fileType,
      {
        title,
        documentType,
        category,
        citation,
        sourceUrl,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined,
        uploadedBy: userId
      }
    );

    // Update document with file metadata
    const document = await prisma.legalDocument.update({
      where: { id: ingestionResult.documentId },
      data: {
        filePath: req.file.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        chunksCount: ingestionResult.chunksProcessed,
        vectorsCount: ingestionResult.vectorsCreated
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
        vectorsStored: ingestionResult.vectorsCreated
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
 * Upload and ingest documents from a folder (folder-based upload)
 * POST /api/ai/documents/folder-upload
 */
export const uploadFromFolder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const { folderPath } = req.body;
    if (!folderPath) {
      return res.status(400).json({ success: false, message: 'Folder path is required' });
    }

    if (!fs.existsSync(folderPath)) {
      return res.status(400).json({ success: false, message: 'Folder does not exist' });
    }

    logger.info(`[AI] Folder upload started: ${folderPath}`);

    // Recursively find all documents
    const documents = await findDocumentsInFolder(folderPath);
    logger.info(`[AI] Found ${documents.length} documents in folder`);

    const results = {
      successful: [] as Array<{ filename: string; documentId: string; chunks: number; vectors: number; category: string; documentType: string }>,
      failed: [] as Array<{ filename: string; error: string }>
    };

    // Process each document
    for (const doc of documents) {
      try {
        const filename = path.basename(doc.filePath);
        const title = filename.replace(/\.[^/.]+$/, ''); // Remove extension
        
        // Infer metadata from folder structure and filename
        const category = inferCategory(doc.relativePath);
        const documentType = inferDocumentType(doc.relativePath);
        const { citation, effectiveDate } = extractMetadataFromFilename(filename);
        
        // Detect file type
        const fileExtension = filename.split('.').pop()?.toLowerCase();
        let fileType: 'pdf' | 'docx';
        
        if (fileExtension === 'pdf') {
          fileType = 'pdf';
        } else if (fileExtension === 'docx' || fileExtension === 'doc') {
          fileType = 'docx';
        } else {
          results.failed.push({
            filename,
            error: 'Unsupported file type'
          });
          continue;
        }

        logger.info(`[AI] Processing: ${doc.relativePath} [${documentType} - ${category}]`);

        // Ingest the document
        const ingestionResult = await documentIngestionService.ingestDocumentFile(
          doc.filePath,
          fileType,
          {
            title,
            documentType,
            category,
            citation,
            effectiveDate,
            uploadedBy: userId
          }
        );

        // Get file stats
        const stats = await fsPromises.stat(doc.filePath);

        // Update document with file metadata
        await prisma.legalDocument.update({
          where: { id: ingestionResult.documentId },
          data: {
            filePath: doc.filePath,
            fileName: filename,
            fileSize: stats.size,
            chunksCount: ingestionResult.chunksProcessed,
            vectorsCount: ingestionResult.vectorsCreated
          }
        });

        results.successful.push({
          filename,
          documentId: ingestionResult.documentId,
          chunks: ingestionResult.chunksProcessed,
          vectors: ingestionResult.vectorsCreated,
          category,
          documentType
        });

        logger.info(`[AI] ✅ Processed: ${filename}`);
      } catch (error: any) {
        logger.error(`[AI] ❌ Failed to process ${doc.relativePath}:`, error);
        results.failed.push({
          filename: path.basename(doc.filePath),
          error: error.message || 'Unknown error'
        });
      }
    }

    const totalChunks = results.successful.reduce((sum, r) => sum + r.chunks, 0);
    const totalVectors = results.successful.reduce((sum, r) => sum + r.vectors, 0);

    logger.info(`[AI] Folder upload completed: ${results.successful.length}/${documents.length} successful`);

    return res.json({
      success: true,
      message: `Folder upload completed: ${results.successful.length}/${documents.length} files processed`,
      data: {
        summary: {
          total: documents.length,
          successful: results.successful.length,
          failed: results.failed.length,
          totalChunks,
          totalVectors
        },
        details: results
      }
    });
  } catch (error: any) {
    logger.error('[AI] Error in folder upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Folder upload failed',
      error: error.message
    });
  }
};

/**
 * Upload and ingest multiple legal documents (bulk upload)
 * POST /api/ai/documents/bulk-upload
 */
export const uploadBulkLegalDocuments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    logger.info(`[AI] Bulk upload started: ${files.length} files`);

    const {
      documentType = 'LEGISLATION',
      category = 'General'
    } = req.body;

    const results = {
      successful: [] as Array<{ filename: string; documentId: string; chunks: number; vectors: number }>,
      failed: [] as Array<{ filename: string; error: string }>
    };

    // Process each file
    for (const file of files) {
      try {
        // Extract title from filename (remove extension)
        const title = file.originalname.replace(/\.[^/.]+$/, '');

        // Detect file type from extension
        const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
        let fileType: 'pdf' | 'docx';
        
        if (fileExtension === 'pdf') {
          fileType = 'pdf';
        } else if (fileExtension === 'docx' || fileExtension === 'doc') {
          fileType = 'docx';
        } else {
          results.failed.push({
            filename: file.originalname,
            error: 'Unsupported file type. Only PDF and DOCX files are supported.'
          });
          continue;
        }

        logger.info(`[AI] Processing: ${file.originalname}`);

        // Ingest the document (extract text, chunk, embed, store in Pinecone)
        const ingestionResult = await documentIngestionService.ingestDocumentFile(
          file.path,
          fileType,
          {
            title,
            documentType,
            category,
            uploadedBy: userId
          }
        );

        // Update document with file metadata
        await prisma.legalDocument.update({
          where: { id: ingestionResult.documentId },
          data: {
            filePath: file.path,
            fileName: file.originalname,
            fileSize: file.size,
            chunksCount: ingestionResult.chunksProcessed,
            vectorsCount: ingestionResult.vectorsCreated
          }
        });

        results.successful.push({
          filename: file.originalname,
          documentId: ingestionResult.documentId,
          chunks: ingestionResult.chunksProcessed,
          vectors: ingestionResult.vectorsCreated
        });

        logger.info(`[AI] ✅ Processed: ${file.originalname}`);
      } catch (error: any) {
        logger.error(`[AI] ❌ Failed to process ${file.originalname}:`, error);
        results.failed.push({
          filename: file.originalname,
          error: error.message || 'Unknown error'
        });
      }
    }

    const totalChunks = results.successful.reduce((sum, r) => sum + r.chunks, 0);
    const totalVectors = results.successful.reduce((sum, r) => sum + r.vectors, 0);

    logger.info(`[AI] Bulk upload completed: ${results.successful.length}/${files.length} successful`);

    return res.json({
      success: true,
      message: `Bulk upload completed: ${results.successful.length}/${files.length} files processed`,
      data: {
        summary: {
          total: files.length,
          successful: results.successful.length,
          failed: results.failed.length,
          totalChunks,
          totalVectors
        },
        details: results
      }
    });
  } catch (error: any) {
    logger.error('[AI] Error in bulk upload:', error);
    return res.status(500).json({
      success: false,
      message: 'Bulk upload failed',
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
    // Get database stats
    const dbStats = await prisma.legalDocument.aggregate({
      _count: { id: true },
      _sum: { chunksCount: true, vectorsCount: true }
    });

    const lastDocument = await prisma.legalDocument.findFirst({
      orderBy: { uploadedAt: 'desc' },
      select: { uploadedAt: true }
    });

    // Get Pinecone stats (actual vector count)
    let pineconeVectorCount = 0;
    try {
      const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
      const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);
      const indexStats = await index.describeIndexStats();
      pineconeVectorCount = indexStats.totalRecordCount || 0;
    } catch (pineconeError) {
      logger.warn('[AI] Could not fetch Pinecone stats:', pineconeError);
      // Fall back to database count if Pinecone fails
      pineconeVectorCount = dbStats._sum.vectorsCount || 0;
    }

    return res.json({
      success: true,
      data: {
        totalDocuments: dbStats._count.id || 0,
        // If DB is empty but Pinecone has vectors, use Pinecone count for chunks too
        // (since each vector represents a text chunk)
        totalChunks: dbStats._sum.chunksCount || pineconeVectorCount,
        totalVectors: pineconeVectorCount, // Use actual Pinecone count
        lastUpdated: lastDocument?.uploadedAt || new Date(),
        // Include both for debugging
        debug: {
          dbVectors: dbStats._sum.vectorsCount || 0,
          dbChunks: dbStats._sum.chunksCount || 0,
          pineconeVectors: pineconeVectorCount,
          mismatch: (dbStats._sum.vectorsCount || 0) !== pineconeVectorCount
        }
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

    // Detect file type from file path
    const fileExtension = document.filePath.split('.').pop()?.toLowerCase();
    let fileType: 'pdf' | 'docx';
    
    if (fileExtension === 'pdf') {
      fileType = 'pdf';
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      fileType = 'docx';
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Unsupported file type for re-indexing. Only PDF and DOCX files are supported.' 
      });
    }

    // Delete existing document record (ingestion will create new one)
    await prisma.legalDocument.delete({
      where: { id }
    });

    // Re-ingest the document
    const ingestionResult = await documentIngestionService.ingestDocumentFile(
      document.filePath,
      fileType,
      {
        title: document.title,
        documentType: document.documentType,
        category: document.category,
        citation: document.citation || undefined,
        sourceUrl: document.sourceUrl || undefined,
        effectiveDate: document.effectiveDate || undefined,
        uploadedBy: document.uploadedBy
      }
    );

    // Update with file metadata
    await prisma.legalDocument.update({
      where: { id: ingestionResult.documentId },
      data: {
        filePath: document.filePath,
        fileName: document.fileName,
        fileSize: document.fileSize,
        chunksCount: ingestionResult.chunksProcessed,
        vectorsCount: ingestionResult.vectorsCreated
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
