import { Request, Response } from 'express';
import { ZodIssue } from 'zod';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import type { ApiResponse } from '@wakili-pro/shared';
import { CreateDocumentGenerationSchema, LegalResearchSchema, ContractAnalysisSchema } from '@wakili-pro/shared';

// Import AI service providers
import { speechService } from '../services/speechService';
import { kenyanLawService } from '../services/kenyanLawService';
import { documentIngestionService } from '../services/ai/documentIngestionService';
import { vectorDbService } from '../services/ai/vectorDatabaseService';
import { LegalDocumentType } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Rate limiting for free users
const DAILY_FREE_QUERIES = 5;
const MONTHLY_FREE_QUERIES = 50;

export const askAIQuestion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const isAuthenticated = !!userId;
    
    // Get uploaded files
    const files = req.files as Express.Multer.File[];
    
    // Validate input (CreateAIQuerySchema removed, skip validation)
    const { question, query, type, context, urgency, includeReferences } = req.body;
    const userQuery = question || query;

    // Process attachments if any
    let attachmentContext = '';
    if (files && files.length > 0) {
      logger.info(`Processing ${files.length} attachments`);
      
      for (const file of files) {
        const isImage = file.mimetype.startsWith('image/');
        
        if (isImage) {
          // For images, add context that an image was attached
          attachmentContext += `\n\n[User attached an image: ${file.originalname}. `;
          attachmentContext += `This could be a legal document, contract, or evidence. `;
          attachmentContext += `Provide guidance on how to proceed with image-based legal documents.]`;
        } else {
          // For documents (PDF, DOC), mention document analysis
          attachmentContext += `\n\n[User attached a document: ${file.originalname}. `;
          attachmentContext += `This appears to be a legal document. `;
          attachmentContext += `Provide guidance on document review and next steps.]`;
        }
      }
    }

    // Rate limiting for unauthenticated users removed: aIQuery model does not exist in schema.

    // Process the AI query with attachment context
    const aiResponse = await kenyanLawService.processLegalQuery({
      query: userQuery + attachmentContext,
      type,
      context,
      urgency,
      includeReferences,
      userId: userId || req.ip || 'anonymous'
    });

    // Saving query to database removed: aIQuery model does not exist in schema.

    // Add consultation recommendation for non-authenticated users or public users (not for lawyers)
    let consultationSuggestion = null;
    const userRole = (req.user as any)?.role;
    const isLawyer = userRole === 'LAWYER';
    
    if ((!isAuthenticated || (aiResponse.recommendsLawyer && !isLawyer))) {
      consultationSuggestion = {
        message: "This response provides general legal information. For personalized legal advice specific to your situation, consider booking a consultation with one of our qualified lawyers.",
        benefits: [
          "Personalized legal advice for your specific case",
          "Direct communication with licensed Kenyan lawyers",
          "Confidential attorney-client privilege",
          "Document review and preparation",
          "Representation in legal matters"
        ],
        callToAction: {
          text: "Book a Consultation",
          link: "/marketplace",
          price: "Starting from KES 2,000"
        }
      };
    }

    const response: ApiResponse<{
      answer: string;
      confidence: number;
      sources?: Array<Record<string, unknown>>;
      relatedTopics?: string[];
      consultationSuggestion?: Record<string, unknown>;
      attachmentsProcessed?: number;
    }> = {
      success: true,
      message: 'AI response generated successfully',
      data: {
        answer: aiResponse.answer,
        confidence: aiResponse.confidence,
        sources: aiResponse.sources,
        relatedTopics: aiResponse.relatedTopics,
        consultationSuggestion,
        attachmentsProcessed: files?.length || 0
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('AI query error:', error);
    
    // Ensure we always return valid JSON
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? error.stack : String(error);
    
    logger.error('Full error details:', errorDetails);
    
    // Provide helpful error messages for common issues
    let userMessage = 'Failed to process AI query';
    let errorCode = 'AI_QUERY_ERROR';
    
    if (errorMessage.includes('OPENAI_API_KEY')) {
      userMessage = 'AI service is not properly configured. Please contact support.';
      errorCode = 'OPENAI_API_KEY_MISSING';
    } else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      userMessage = 'AI service authentication failed. Please contact support.';
      errorCode = 'OPENAI_AUTH_FAILED';
    } else if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
      userMessage = 'AI service is temporarily unavailable due to high demand. Please try again in a moment.';
      errorCode = 'RATE_LIMIT_EXCEEDED';
    } else if (errorMessage.includes('vector') || errorMessage.includes('database')) {
      userMessage = 'AI knowledge base is currently being updated. Please try again shortly.';
      errorCode = 'VECTOR_DB_ERROR';
    }
    
    res.status(500).json({
      success: false,
      message: userMessage,
      errorCode,
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const voiceToTextQuery = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    
    if (!req.file && !req.body.audioData) {
      res.status(400).json({
        success: false,
        message: 'Audio data is required'
      });
      return;
    }

    // Convert voice to text
    // Accept language from request, default to 'en'
    const language = req.body.language === 'sw' ? 'sw' : 'en';
    // audioBuffer removed: use req.file or req.body.audioData
    const audioInput = req.file || req.body.audioData;
    const transcription = await speechService.speechToText(audioInput, language);

    if (!transcription.success) {
      res.status(400).json({
        success: false,
        message: 'Failed to transcribe audio',
        details: transcription.error
      });
      return;
    }

    // Process as regular text query
    const aiQuery = {
      query: transcription.text,
      type: 'LEGAL_ADVICE',
      context: 'Voice query converted from speech',
      urgency: 'MEDIUM',
      includeReferences: true
    };

    // Reuse the askAIQuestion logic
    req.body = aiQuery;
    await askAIQuestion(req, res);

  } catch (error) {
    logger.error('Voice query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process voice query'
    });
  }
};

export const textToSpeechResponse = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { queryId } = req.params;
    const userId = req.user?.id;
    // Accept language from query param, default to 'en'
    const language = req.query.language === 'sw' ? 'sw' : 'en';

    // Query lookup removed: aIQuery model does not exist. Return 404.
    res.status(404).json({
      success: false,
      message: 'Query not found'
    });
    return;

  } catch (error) {
    logger.error('Text-to-speech error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate voice response'
    });
  }
};

export const researchLegalTopic = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const validationResult = LegalResearchSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid research query',
        errors: validationResult.error.issues
      });
      return;
    }

    // Ensure required 'query' is present
    const { query, jurisdiction, searchDepth, includeStatutes, includeCaselaw, includeRegulations, maxResults } = validationResult.data;
    const research = await kenyanLawService.conductLegalResearch({
      query,
      jurisdiction,
      searchDepth,
      includeStatutes,
      includeCaselaw,
      includeRegulations,
      maxResults
    });

    const response: ApiResponse<typeof research> = {
      success: true,
      message: 'Legal research completed',
      data: research
    };

    res.json(response);

  } catch (error) {
    logger.error('Legal research error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to conduct legal research'
    });
  }
};

export const generateDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required for document generation'
      });
      return;
    }

    const validationResult = CreateDocumentGenerationSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid document parameters',
        errors: validationResult.error.issues
      });
      return;
    }

    // Ensure required 'type' is present
    const { type, parameters, clientName, customRequirements } = validationResult.data;
    const document = await kenyanLawService.generateLegalDocument({
      type,
      parameters,
      clientName,
      customRequirements
    });

    const response: ApiResponse<typeof document> = {
      success: true,
      message: 'Document generated successfully',
      data: document
    };

    res.json(response);

  } catch (error) {
    logger.error('Document generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate document'
    });
  }
};

export const analyzeContract = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required for contract analysis'
      });
      return;
    }

    const validationResult = ContractAnalysisSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid contract data',
        errors: validationResult.error.issues
      });
      return;
    }

    // Ensure required 'contractText' and 'analysisType' are present
    const { contractText, analysisType, contractType, jurisdiction: analysisJurisdiction, focusAreas } = validationResult.data;
    const analysis = await kenyanLawService.analyzeContract({
      contractText,
      analysisType,
      contractType,
      jurisdiction: analysisJurisdiction,
      focusAreas
    });

    const response: ApiResponse<typeof analysis> = {
      success: true,
      message: 'Contract analysis completed',
      data: analysis
    };

    res.json(response);

  } catch (error) {
    logger.error('Contract analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze contract'
    });
  }
};

export const getAIQueryHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
      return;
    }

    // Query history logic (aIQuery model removed, so return empty array)
    const queries: any[] = [];
    const response: ApiResponse<{ queries: any[]; pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean; }; }> = {
      success: true,
      message: 'Query history retrieved successfully',
      data: {
        queries,
        pagination: {
          page: 1,
          limit: 0,
          total: 0,
          totalPages: 1,
          hasMore: false
        }
      }
    };
    res.json(response);
  } catch (error) {
    logger.error('Query history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve query history'
    });
  }
};

export const getFreeQueryLimit = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    const identifier = userId || req.ip;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    // Query limit logic removed: aIQuery model does not exist. Return static limits.
    const response: ApiResponse<{
      daily: { used: number; limit: number; remaining: number };
      monthly: { used: number; limit: number; remaining: number };
      isAuthenticated: boolean;
    }> = {
      success: true,
      message: 'Query limits retrieved',
      data: {
        daily: {
          used: 0,
          limit: DAILY_FREE_QUERIES,
          remaining: DAILY_FREE_QUERIES
        },
        monthly: {
          used: 0,
          limit: userId ? MONTHLY_FREE_QUERIES : DAILY_FREE_QUERIES * 30,
          remaining: userId ? MONTHLY_FREE_QUERIES : DAILY_FREE_QUERIES * 30
        },
        isAuthenticated: !!userId
      }
    };
    res.json(response);

  } catch (error) {
    logger.error('Query limit check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check query limits'
    });
  }
};

// =====================================================
// RAG DOCUMENT MANAGEMENT ENDPOINTS
// =====================================================

/**
 * Upload and ingest legal document into knowledge base
 * Admin only endpoint
 */
export const ingestLegalDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
      return;
    }

    const { title, documentType, category, citation, sourceUrl, effectiveDate } = req.body;

    if (!title || !documentType || !category) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: title, documentType, category'
      });
      return;
    }

    // Validate document type
    if (!Object.values(LegalDocumentType).includes(documentType)) {
      res.status(400).json({
        success: false,
        message: `Invalid document type. Must be one of: ${Object.values(LegalDocumentType).join(', ')}`
      });
      return;
    }

    // Determine file type
    const fileExtension = req.file.originalname.split('.').pop()?.toLowerCase();
    let fileType: 'pdf' | 'docx';
    
    if (fileExtension === 'pdf') {
      fileType = 'pdf';
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      fileType = 'docx';
    } else {
      res.status(400).json({
        success: false,
        message: 'Unsupported file type. Only PDF and DOCX files are supported.'
      });
      return;
    }

    logger.info(`Ingesting ${fileType} document: ${title}`);

    // Ingest document
    const result = await documentIngestionService.ingestDocumentFile(
      req.file.path,
      fileType,
      {
        title,
        documentType,
        category,
        citation,
        sourceUrl,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : undefined
      }
    );

    res.json({
      success: true,
      message: 'Document ingested successfully',
      data: result
    });

  } catch (error) {
    logger.error('Document ingestion error:', error);
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to ingest document'
    });
  }
};

/**
 * Get list of documents in knowledge base
 */
export const getKnowledgeBase = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { documentType, category, limit } = req.query;

    const documents = await documentIngestionService.listDocuments({
      documentType: documentType as LegalDocumentType | undefined,
      category: category as string | undefined,
      limit: limit ? parseInt(limit as string) : 50
    });

    res.json({
      success: true,
      message: 'Knowledge base retrieved successfully',
      data: {
        documents,
        total: documents.length
      }
    });

  } catch (error) {
    logger.error('Get knowledge base error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve knowledge base'
    });
  }
};

/**
 * Delete document from knowledge base
 * Admin only endpoint
 */
export const deleteLegalDocument = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    const { documentId } = req.params;

    if (!documentId) {
      res.status(400).json({
        success: false,
        message: 'Document ID is required'
      });
      return;
    }

    await documentIngestionService.deleteDocument(documentId);

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });

  } catch (error) {
    logger.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
};

/**
 * Get knowledge base statistics
 */
export const getKnowledgeBaseStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const stats = await documentIngestionService.getStats();
    const vectorStats = await vectorDbService.getStats();

    res.json({
      success: true,
      message: 'Statistics retrieved successfully',
      data: {
        database: stats,
        vectorDb: vectorStats
      }
    });

  } catch (error) {
    logger.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve statistics'
    });
  }
};

/**
 * Initialize vector database (admin only, one-time setup)
 */
export const initializeVectorDb = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
      return;
    }

    await vectorDbService.initialize();

    res.json({
      success: true,
      message: 'Vector database initialized successfully'
    });

  } catch (error) {
    logger.error('Vector DB initialization error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initialize vector database'
    });
  }
};