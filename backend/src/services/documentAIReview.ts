import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface AIReviewResult {
  overallScore: number;
  completeness: {
    score: number;
    missingFields: string[];
    incompleteFields: string[];
    recommendations: string[];
  };
  consistency: {
    score: number;
    inconsistencies: string[];
    warnings: string[];
  };
  legalCompliance: {
    score: number;
    issues: string[];
    risks: string[];
    suggestions: string[];
  };
  formatting: {
    score: number;
    issues: string[];
  };
  summary: string;
  detailedAnalysis: string;
  recommendsCertification: boolean;
  estimatedCertificationTime: string;
}

/**
 * Review document with AI (Gemini)
 */
export const reviewDocumentWithAI = async (
  reviewId: string,
  documentUrl: string,
  documentType: string,
  templateData?: any
): Promise<void> => {
  try {
    // Update status to processing
    await prisma.documentReview.update({
      where: { id: reviewId },
      data: { aiReviewStatus: 'PROCESSING' }
    });

    // Read document content
    const documentPath = path.join(__dirname, '../../storage', documentUrl.replace('/uploads/', ''));
    const documentContent = await fs.readFile(documentPath, 'utf-8');

    // Generate AI review prompt
    const prompt = generateReviewPrompt(documentType, documentContent, templateData);

    // Call Gemini API
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const aiAnalysis = response.text();

    // Parse AI response
    const reviewResults = parseAIResponse(aiAnalysis);

    // Update document review with results
    await prisma.documentReview.update({
      where: { id: reviewId },
      data: {
        aiReviewStatus: 'COMPLETED',
        aiReviewResults: reviewResults as any,
        aiReviewCompletedAt: new Date()
      }
    });

    console.log(`AI review completed for document ${reviewId}`);
  } catch (error) {
    console.error('AI review error:', error);
    
    // Update status to failed
    await prisma.documentReview.update({
      where: { id: reviewId },
      data: {
        aiReviewStatus: 'FAILED',
        aiReviewResults: {
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        } as any
      }
    });
  }
};

/**
 * Generate comprehensive review prompt for Gemini
 */
function generateReviewPrompt(documentType: string, documentContent: string, templateData?: any): string {
  let prompt = `You are an expert legal document reviewer. Analyze the following ${documentType} document comprehensively and provide a detailed review.

DOCUMENT CONTENT:
${documentContent}

`;

  if (templateData) {
    prompt += `
TEMPLATE INFORMATION:
- Document Name: ${templateData.name}
- Description: ${templateData.description}
- Type: ${templateData.type}

`;
  }

  prompt += `
Please provide a COMPREHENSIVE analysis in the following JSON format:

{
  "overallScore": <0-100>,
  "completeness": {
    "score": <0-100>,
    "missingFields": ["list of required fields that are missing or empty"],
    "incompleteFields": ["list of fields that are filled but incomplete"],
    "recommendations": ["specific recommendations for completing the document"]
  },
  "consistency": {
    "score": <0-100>,
    "inconsistencies": ["list of inconsistent information found in the document"],
    "warnings": ["potential issues with dates, names, or references"]
  },
  "legalCompliance": {
    "score": <0-100>,
    "issues": ["legal compliance issues or missing required clauses"],
    "risks": ["potential legal risks identified in the document"],
    "suggestions": ["suggestions to improve legal compliance"]
  },
  "formatting": {
    "score": <0-100>,
    "issues": ["formatting issues that need correction"]
  },
  "summary": "A brief 2-3 sentence summary of the document's status",
  "detailedAnalysis": "A detailed paragraph explaining all findings, issues, and recommendations",
  "recommendsCertification": <true/false - whether this document should be certified by a lawyer>,
  "estimatedCertificationTime": "Estimated time a lawyer would need to review and certify this document"
}

IMPORTANT:
1. Be thorough and check every aspect of the document
2. Identify all missing information, even optional fields that would strengthen the document
3. Check for consistency in names, dates, and references throughout
4. Verify legal compliance with Kenyan law requirements
5. Assess if the document is ready for use or needs improvements
6. Only respond with valid JSON, no additional text

Analyze now:`;

  return prompt;
}

/**
 * Parse Gemini AI response into structured review results
 */
function parseAIResponse(aiResponse: string): AIReviewResult {
  try {
    // Extract JSON from response (in case there's extra text)
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate required fields
    const required: AIReviewResult = {
      overallScore: parsed.overallScore || 0,
      completeness: {
        score: parsed.completeness?.score || 0,
        missingFields: parsed.completeness?.missingFields || [],
        incompleteFields: parsed.completeness?.incompleteFields || [],
        recommendations: parsed.completeness?.recommendations || []
      },
      consistency: {
        score: parsed.consistency?.score || 0,
        inconsistencies: parsed.consistency?.inconsistencies || [],
        warnings: parsed.consistency?.warnings || []
      },
      legalCompliance: {
        score: parsed.legalCompliance?.score || 0,
        issues: parsed.legalCompliance?.issues || [],
        risks: parsed.legalCompliance?.risks || [],
        suggestions: parsed.legalCompliance?.suggestions || []
      },
      formatting: {
        score: parsed.formatting?.score || 0,
        issues: parsed.formatting?.issues || []
      },
      summary: parsed.summary || 'AI review completed',
      detailedAnalysis: parsed.detailedAnalysis || 'No detailed analysis provided',
      recommendsCertification: parsed.recommendsCertification || false,
      estimatedCertificationTime: parsed.estimatedCertificationTime || '2-4 hours'
    };

    return required;
  } catch (error) {
    console.error('Error parsing AI response:', error);
    
    // Return default response on parsing error
    return {
      overallScore: 0,
      completeness: {
        score: 0,
        missingFields: [],
        incompleteFields: [],
        recommendations: ['Unable to analyze document. Please try again.']
      },
      consistency: {
        score: 0,
        inconsistencies: [],
        warnings: []
      },
      legalCompliance: {
        score: 0,
        issues: [],
        risks: [],
        suggestions: []
      },
      formatting: {
        score: 0,
        issues: []
      },
      summary: 'AI review failed to process',
      detailedAnalysis: `An error occurred while analyzing the document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      recommendsCertification: true,
      estimatedCertificationTime: '2-4 hours'
    };
  }
}

/**
 * Get simplified review status for user display
 */
export const getReviewStatusSummary = (reviewResults: any): {
  status: 'excellent' | 'good' | 'needs-improvement' | 'critical-issues';
  color: string;
  message: string;
} => {
  const score = reviewResults?.overallScore || 0;

  if (score >= 90) {
    return {
      status: 'excellent',
      color: 'green',
      message: 'Your document is in excellent condition and ready for use!'
    };
  } else if (score >= 75) {
    return {
      status: 'good',
      color: 'blue',
      message: 'Your document is good but has minor improvements needed.'
    };
  } else if (score >= 50) {
    return {
      status: 'needs-improvement',
      color: 'yellow',
      message: 'Your document needs several improvements before use.'
    };
  } else {
    return {
      status: 'critical-issues',
      color: 'red',
      message: 'Your document has critical issues that must be addressed.'
    };
  }
};
