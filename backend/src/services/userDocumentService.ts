import { PrismaClient, DocumentType, DocumentStatus, DocumentSource } from '@prisma/client';
import { uploadToCloudinary, deleteFromCloudinary, UploadResult } from './fileUploadService';

const prisma = new PrismaClient();

export interface CreateDocumentData {
  userId: string;
  title: string;
  type: DocumentType;
  category?: string;
  fileBuffer: Buffer;
  fileName: string;
  mimeType: string;
  source?: DocumentSource;
  templateId?: string;
}

export interface UpdateDocumentData {
  title?: string;
  type?: DocumentType;
  category?: string;
  status?: DocumentStatus;
}

/**
 * Upload a new document for a user
 */
export const uploadUserDocument = async (data: CreateDocumentData) => {
  try {
    // Upload file to Cloudinary
    const uploadResult: UploadResult = await uploadToCloudinary(
      data.fileBuffer,
      data.fileName,
      `user-documents/${data.userId}`
    );

    // Create database record
    const document = await prisma.userDocument.create({
      data: {
        userId: data.userId,
        title: data.title,
        type: data.type,
        category: data.category,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.fileSize,
        fileName: uploadResult.fileName,
        mimeType: data.mimeType,
        source: data.source || DocumentSource.UPLOADED,
        templateId: data.templateId,
        status: DocumentStatus.DRAFT,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      data: document,
      message: 'Document uploaded successfully',
    };
  } catch (error) {
    console.error('Upload user document error:', error);
    throw new Error('Failed to upload document');
  }
};

/**
 * Get all documents for a user
 */
export const getUserDocuments = async (userId: string, filters?: {
  status?: DocumentStatus;
  type?: DocumentType;
  search?: string;
}) => {
  try {
    const where: any = {
      userId,
      deletedAt: null, // Only get non-deleted documents
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { category: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const documents = await prisma.userDocument.findMany({
      where,
      orderBy: {
        uploadedAt: 'desc',
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        reviews: {
          select: {
            id: true,
            reviewType: true,
            aiReviewStatus: true,
            certificationStatus: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    return {
      success: true,
      data: documents,
    };
  } catch (error) {
    console.error('Get user documents error:', error);
    throw new Error('Failed to retrieve documents');
  }
};

/**
 * Get a single document by ID
 */
export const getDocumentById = async (documentId: string, userId: string) => {
  try {
    const document = await prisma.userDocument.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
      include: {
        template: true,
        reviews: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return {
      success: true,
      data: document,
    };
  } catch (error) {
    console.error('Get document by ID error:', error);
    throw error;
  }
};

/**
 * Update document metadata
 */
export const updateDocument = async (
  documentId: string,
  userId: string,
  updates: UpdateDocumentData
) => {
  try {
    const document = await prisma.userDocument.updateMany({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
      data: updates,
    });

    if (document.count === 0) {
      throw new Error('Document not found or unauthorized');
    }

    return {
      success: true,
      message: 'Document updated successfully',
    };
  } catch (error) {
    console.error('Update document error:', error);
    throw error;
  }
};

/**
 * Soft delete a document
 */
export const deleteDocument = async (documentId: string, userId: string) => {
  try {
    const document = await prisma.userDocument.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Soft delete
    await prisma.userDocument.update({
      where: { id: documentId },
      data: { deletedAt: new Date() },
    });

    // Optional: Delete from Cloudinary (uncomment if you want hard delete)
    // const publicId = document.fileUrl.split('/').slice(-2).join('/').split('.')[0];
    // await deleteFromCloudinary(publicId);

    return {
      success: true,
      message: 'Document deleted successfully',
    };
  } catch (error) {
    console.error('Delete document error:', error);
    throw error;
  }
};

/**
 * Request review for a document
 */
export const requestDocumentReview = async (
  documentId: string,
  userId: string,
  reviewType: 'AI_REVIEW' | 'CERTIFICATION'
) => {
  try {
    const document = await prisma.userDocument.findFirst({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Update document status
    await prisma.userDocument.update({
      where: { id: documentId },
      data: { status: DocumentStatus.UNDER_REVIEW },
    });

    // Create document review entry
    const review = await prisma.documentReview.create({
      data: {
        userId,
        documentSource: 'EXTERNAL' as any,
        uploadedDocumentUrl: document.fileUrl,
        originalFileName: document.fileName,
        documentType: document.type,
        reviewType: reviewType as any,
        urgency: 'STANDARD' as any,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        price: reviewType === 'AI_REVIEW' ? 500 : 3000,
      },
    });

    return {
      success: true,
      data: review,
      message: 'Review request submitted successfully',
    };
  } catch (error) {
    console.error('Request document review error:', error);
    throw error;
  }
};

/**
 * Store a purchased document template as user document
 */
export const storePurchasedDocument = async (
  userId: string,
  templateId: string,
  customizedContent: string,
  fileName: string
) => {
  try {
    const template = await prisma.documentTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Convert customized content to buffer for upload
    const fileBuffer = Buffer.from(customizedContent, 'utf-8');

    const uploadResult = await uploadToCloudinary(
      fileBuffer,
      fileName,
      `user-documents/${userId}/purchased`
    );

    const document = await prisma.userDocument.create({
      data: {
        userId,
        title: template.name,
        type: template.type as DocumentType,
        category: template.type,
        fileUrl: uploadResult.url,
        fileSize: uploadResult.fileSize,
        fileName: fileName,
        mimeType: 'application/pdf',
        source: DocumentSource.PURCHASED,
        templateId: templateId,
        status: DocumentStatus.FINALIZED,
      },
    });

    return {
      success: true,
      data: document,
    };
  } catch (error) {
    console.error('Store purchased document error:', error);
    throw error;
  }
};
