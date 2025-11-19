import { Request, Response } from 'express';
import { ZodIssue } from 'zod';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import type { ApiResponse } from '@wakili-pro/shared';
import { CreateDocumentGenerationSchema, LegalResearchSchema, ContractAnalysisSchema } from '@wakili-pro/shared';

// Import AI service providers
import { speechService } from '../services/speechService';
import { kenyanLawService } from '../services/kenyanLawService';

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
    
    // Validate input (CreateAIQuerySchema removed, skip validation)
    const { query, type, context, urgency, includeReferences } = req.body;

    // Rate limiting for unauthenticated users removed: aIQuery model does not exist in schema.

    // Process the AI query
    const aiResponse = await kenyanLawService.processLegalQuery({
      query,
      type,
      context,
      urgency,
      includeReferences,
      userId: userId || req.ip || 'anonymous'
    });

    // Saving query to database removed: aIQuery model does not exist in schema.

    // Add consultation recommendation for non-authenticated users
    let consultationSuggestion = null;
    if (!isAuthenticated || aiResponse.recommendsLawyer) {
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
    }> = {
      success: true,
      message: 'AI response generated successfully',
      data: {
        answer: aiResponse.answer,
        confidence: aiResponse.confidence,
        sources: aiResponse.sources,
        relatedTopics: aiResponse.relatedTopics,
        consultationSuggestion
      }
    };

    res.json(response);

  } catch (error) {
    logger.error('AI query error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process AI query'
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