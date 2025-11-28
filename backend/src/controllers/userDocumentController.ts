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

    const { status, type, search } = req.query;

    const result = await getUserDocuments(userId, {
      status: status as DocumentStatus | undefined,
      type: type as DocumentType | undefined,
      search: search as string | undefined,
    });

    res.json(result);
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
    const { reviewType } = req.body; // 'AI_REVIEW' or 'CERTIFICATION'

    if (!reviewType || !['AI_REVIEW', 'CERTIFICATION'].includes(reviewType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid review type',
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
