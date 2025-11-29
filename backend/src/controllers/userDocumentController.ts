import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  uploadUserDocument,
  getUserDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  requestDocumentReview,
} from '../services/userDocumentService';
import { isValidDocumentType, isValidFileSize } from '../services/fileUploadService';
import { DocumentType, DocumentStatus } from '@prisma/client';

/**
 * Upload a new document
 * POST /api/documents/upload
 */
export const uploadDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    const { title, type, category } = req.body;

    // Validate required fields
    if (!title || !type) {
      return res.status(400).json({
        success: false,
        message: 'Title and type are required',
      });
    }

    // Validate file type
    if (!isValidDocumentType(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed',
      });
    }

    // Validate file size
    if (!isValidFileSize(req.file.size)) {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 20MB limit',
      });
    }

    const result = await uploadUserDocument({
      userId,
      title,
      type: type as DocumentType,
      category,
      fileBuffer: req.file.buffer,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Upload document controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload document',
    });
  }
};

/**
 * Get all user documents
 * GET /api/documents
 */
export const getDocuments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    console.log('[UserDocuments] Getting documents for user:', userId);

    const { status, type, search } = req.query;

    const result = await getUserDocuments(userId, {
      status: status as DocumentStatus | undefined,
      type: type as DocumentType | undefined,
      search: search as string | undefined,
    });

    console.log('[UserDocuments] Found', result.data?.length, 'documents');
    if (result.data && result.data.length > 0) {
      console.log('[UserDocuments] First document ID:', result.data[0].id, 'Type:', typeof result.data[0].id);
    }

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Get documents controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve documents',
    });
  }
};

/**
 * Get a single document
 * GET /api/documents/:id
 */
export const getDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { id } = req.params;
    const result = await getDocumentById(id, userId);

    res.json(result);
  } catch (error: any) {
    console.error('Get document controller error:', error);
    res.status(error.message === 'Document not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to retrieve document',
    });
  }
};

/**
 * Update document metadata
 * PATCH /api/documents/:id
 */
export const updateDocumentMetadata = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { id } = req.params;
    const { title, type, category, status } = req.body;

    const result = await updateDocument(id, userId, {
      title,
      type: type as DocumentType | undefined,
      category,
      status: status as DocumentStatus | undefined,
    });

    res.json(result);
  } catch (error: any) {
    console.error('Update document controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update document',
    });
  }
};

/**
 * Delete a document
 * DELETE /api/documents/:id
 */
export const deleteUserDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { id } = req.params;
    const result = await deleteDocument(id, userId);

    res.json(result);
  } catch (error: any) {
    console.error('Delete document controller error:', error);
    res.status(error.message === 'Document not found' ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to delete document',
    });
  }
};

/**
 * Request review for a document
 * POST /api/documents/:id/request-review
 */
export const requestReview = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { id } = req.params;
    const { reviewType } = req.body; // 'AI_ONLY', 'CERTIFICATION', or 'AI_PLUS_CERTIFICATION'

    if (!reviewType || !['AI_ONLY', 'CERTIFICATION', 'AI_PLUS_CERTIFICATION'].includes(reviewType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review type. Must be AI_ONLY, CERTIFICATION, or AI_PLUS_CERTIFICATION',
      });
    }

    const result = await requestDocumentReview(id, userId, reviewType);

    res.json(result);
  } catch (error: any) {
    console.error('Request review controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to request review',
    });
  }
};

/**
 * Download a document (proxy through backend to avoid CORS issues)
 * GET /api/user-documents/:id/download
 */
export const downloadDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const { id } = req.params;
    const document = await getDocumentById(id, userId);

    if (!document.success || !document.data) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    const fileUrl = document.data.fileUrl;
    if (!fileUrl) {
      return res.status(404).json({
        success: false,
        message: 'File URL not available',
      });
    }

    // Fetch the file from Cloudinary
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(fileUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.status}`);
    }

    // Get the content type from Cloudinary response
    const contentType = response.headers.get('content-type') || 'application/pdf';
    
    // Set response headers for download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.data.title}.pdf"`);
    
    // Pipe the file stream to response
    const buffer = await response.buffer();
    res.send(buffer);
  } catch (error: any) {
    console.error('Download document controller error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download document',
    });
  }
};
