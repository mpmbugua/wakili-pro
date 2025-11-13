import { Request, Response } from 'express';
import { ZodIssue } from 'zod';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import type { ApiResponse } from '@wakili-pro/shared';
import { CreateAIQuerySchema, CreateDocumentGenerationSchema, LegalResearchSchema, ContractAnalysisSchema } from '@wakili-pro/shared';

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
    
    // Validate input
    const validationResult = CreateAIQuerySchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid input',
        errors: validationResult.error.issues.map((issue: ZodIssue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }))
      });
      return;
    }

    const { query, type, context, urgency, includeReferences } = validationResult.data;

    // Check rate limits for unauthenticated users
    if (!isAuthenticated) {
      const clientIP = req.ip;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const dailyQueries = await prisma.aIQuery.count({
        where: {
          userId: clientIP, // Use IP for anonymous users
          createdAt: { gte: today }
        }
      });

      if (dailyQueries >= DAILY_FREE_QUERIES) {
        res.status(429).json({
          success: false,
          message: 'Daily free query limit reached. Sign up for unlimited access!',
          data: {
            limit: DAILY_FREE_QUERIES,
            used: dailyQueries,
            upgradeMessage: 'Create a free account to get 50 queries per month and access to premium features.',
            callToAction: {
              text: 'Sign Up Now',
              link: '/auth/register'
            }
          }
        });
        return;
      }
    }

    // Process the AI query
    const aiResponse = await kenyanLawService.processLegalQuery({
      query,
      type,
      context,
      urgency,
      includeReferences,
      userId: userId || req.ip || 'anonymous'
    });

    // Save query to database
    const savedQuery = await prisma.aIQuery.create({
      data: {
        userId: userId || req.ip || 'anonymous',
        query,
        type: type as any,
        context: (context as any) || 'LEGAL_ADVICE',
        response: aiResponse.answer,
        confidence: aiResponse.confidence,
        tokensUsed: aiResponse.tokensUsed
      }
    });

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
      id: string;
      answer: string;
      confidence: number;
      sources?: any[];
      relatedTopics?: string[];
      consultationSuggestion?: any;
      remainingQueries?: number;
    }> = {
      success: true,
      message: 'AI response generated successfully',
      data: {
        id: savedQuery.id,
        answer: aiResponse.answer,
        confidence: aiResponse.confidence,
        sources: aiResponse.sources,
        relatedTopics: aiResponse.relatedTopics,
        consultationSuggestion,
        remainingQueries: isAuthenticated ? undefined : DAILY_FREE_QUERIES - (await prisma.aIQuery.count({
          where: {
            userId: req.ip,
            createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }
          }
        })) - 1
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
    const audioBuffer = req.file ? req.file.buffer : Buffer.from(req.body.audioData, 'base64');
    const transcription = await speechService.speechToText(audioBuffer);

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

    // Get the AI query response
    const query = await prisma.aIQuery.findFirst({
      where: {
        id: queryId,
        userId: userId || req.ip
      }
    });

    if (!query) {
      res.status(404).json({
        success: false,
        message: 'Query not found'
      });
      return;
    }

    // Convert response to speech
    const audioResult = await speechService.textToSpeech(query.response);

    if (!audioResult.success) {
      res.status(500).json({
        success: false,
        message: 'Failed to generate audio response'
      });
      return;
    }

    // Return audio file
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', `attachment; filename="legal-advice-${queryId}.mp3"`);
    res.send(audioResult.audioBuffer);

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

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const [queries, total] = await Promise.all([
      prisma.aIQuery.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        select: {
          id: true,
          query: true,
          type: true,
          context: true,
          response: true,
          confidence: true,
          createdAt: true
        }
      }),
      prisma.aIQuery.count({ where: { userId } })
    ]);

    const response: ApiResponse<{
      queries: typeof queries;
      pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
      };
    }> = {
      success: true,
      message: 'Query history retrieved',
      data: {
        queries,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasMore: page * limit < total
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

    const [dailyCount, monthlyCount] = await Promise.all([
      prisma.aIQuery.count({
        where: {
          userId: identifier,
          createdAt: { gte: today }
        }
      }),
      prisma.aIQuery.count({
        where: {
          userId: identifier,
          createdAt: { gte: thisMonth }
        }
      })
    ]);

    const response: ApiResponse<{
      daily: { used: number; limit: number; remaining: number };
      monthly: { used: number; limit: number; remaining: number };
      isAuthenticated: boolean;
    }> = {
      success: true,
      message: 'Query limits retrieved',
      data: {
        daily: {
          used: dailyCount,
          limit: DAILY_FREE_QUERIES,
          remaining: Math.max(0, DAILY_FREE_QUERIES - dailyCount)
        },
        monthly: {
          used: monthlyCount,
          limit: userId ? MONTHLY_FREE_QUERIES : DAILY_FREE_QUERIES * 30,
          remaining: Math.max(0, (userId ? MONTHLY_FREE_QUERIES : DAILY_FREE_QUERIES * 30) - monthlyCount)
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