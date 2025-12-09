import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { ragService } from './ai/ragService';
import { PrismaClient } from '@prisma/client';

// Validate OpenAI API key at startup
if (!process.env.OPENAI_API_KEY) {
  logger.error('CRITICAL: OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'missing-key',
});

const prisma = new PrismaClient();

interface LegalQueryRequest {
  query: string;
  type: string;
  context?: string;
  urgency: string;
  includeReferences: boolean;
  userId: string;
}

interface LegalQueryResponse {
  answer: string;
  confidence: number;
  tokensUsed: number;
  sources: Array<{ type: string; title: string; jurisdiction: string }>;
  relatedTopics: string[];
  recommendsLawyer: boolean;
}



interface LegalResearchRequest {
  query: string;
  jurisdiction: string;
  searchDepth: string;
  includeStatutes: boolean;
  includeCaselaw: boolean;
  includeRegulations: boolean;
  maxResults: number;
}

interface DocumentGenerationRequest {
  type: string;
  parameters: Record<string, unknown>;
  clientName: string;
  customRequirements?: string;
}

interface ContractAnalysisRequest {
  contractText: string;
  analysisType: string;
  jurisdiction: string;
  contractType?: string;
  focusAreas?: string[];
}

class KenyanLawService {
  private readonly kenyanLawContext = `
You are an AI legal assistant specialized in Kenyan law and the legal system of Kenya. 
You provide accurate, helpful legal information based on:

1. The Constitution of Kenya (2010)
2. Kenyan statutes and acts
3. Case law from Kenyan courts
4. Legal precedents and procedures
5. East African Community legal frameworks where applicable

IMPORTANT DISCLAIMERS:
- Always emphasize that your responses are for informational purposes only
- Recommend seeking professional legal advice for specific situations
- Mention that laws may have changed and should be verified
- Suggest consultation with licensed Kenyan advocates for legal matters
- Never provide advice that could be construed as practicing law

FORMAT YOUR RESPONSES:
1. Direct answer to the question
2. Relevant legal framework/statute references
3. Key points to consider
4. Recommendation to consult a qualified lawyer
5. Suggest booking a consultation if complex

Be conversational but professional, accurate but accessible to laypeople.
`;

  async processLegalQuery(request: LegalQueryRequest): Promise<LegalQueryResponse> {
    try {
      logger.info(`Processing legal query with RAG: "${request.query.substring(0, 50)}..."`);

      // TEMPORARY: Skip RAG and go directly to fallback for debugging
      logger.warn('Temporarily bypassing RAG for debugging - using direct GPT');
      return this.processLegalQueryFallback(request);

      // Conversation history disabled until ConversationHistory model is added to schema
      const conversationHistory: Array<{ role: string; content: string }> = [];

      // Use RAG service to get answer with legal document context
      const ragResponse = await ragService.query(request.query, conversationHistory);

      // Database save disabled until AIQuery schema is fixed (currently using 'aIQuery' which doesn't match 'AIQuery' model)
      // TODO: Fix model name mismatch and re-enable database logging

      // Analyze response to determine if lawyer consultation is recommended
      const recommendsLawyer = this.shouldRecommendLawyer(request.query, ragResponse.answer);
      
      // Convert RAG sources to expected format
      const sources = ragResponse.context.sources.map(s => ({
        type: 'LEGAL_DOCUMENT',
        title: s.title,
        jurisdiction: 'KENYA',
        citation: s.citation || '',
        section: s.section || ''
      }));

      logger.info(`RAG query successful: ${ragResponse.context.retrievedCount} sources, ${ragResponse.tokensUsed} tokens, model: ${ragResponse.modelUsed}`);

      return {
        answer: ragResponse.answer,
        confidence: ragResponse.confidence,
        tokensUsed: ragResponse.tokensUsed,
        sources,
        relatedTopics: this.extractRelatedTopics(request.query),
        recommendsLawyer
      };

    } catch (error) {
      logger.error('RAG query processing error:', error);
      
      // Fallback to direct GPT if RAG fails
      logger.warn('Falling back to direct GPT (RAG unavailable)');
      return this.processLegalQueryFallback(request);
    }
  }

  // Fallback method using direct GPT (original implementation)
  private async processLegalQueryFallback(request: LegalQueryRequest): Promise<LegalQueryResponse> {
    try {
      // Validate API key before making request
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'missing-key') {
        logger.error('OpenAI API key is not configured');
        throw new Error('OPENAI_API_KEY not configured. Please set the environment variable.');
      }

      const prompt = this.buildQueryPrompt(request);
      
      logger.info('Calling OpenAI API with fallback method...');
      logger.info(`API Key present: ${!!process.env.OPENAI_API_KEY}, starts with: ${process.env.OPENAI_API_KEY?.substring(0, 10)}...`);
      
      // Try with gpt-4o-mini first (more reliable, cheaper)
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: this.kenyanLawContext },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content || 'Unable to generate response';
      const tokensUsed = completion.usage?.total_tokens || 0;

      logger.info(`OpenAI API call successful - ${tokensUsed} tokens used`);

      // Analyze response to determine if lawyer consultation is recommended
      const recommendsLawyer = this.shouldRecommendLawyer(request.query, response);
      
      return {
        answer: response,
        confidence: this.calculateConfidence(response),
        tokensUsed,
        sources: this.extractSources(response),
        relatedTopics: this.extractRelatedTopics(request.query),
        recommendsLawyer
      };

    } catch (error) {
      logger.error('Fallback AI query processing error:', error);
      
      // Provide more specific error messages
      if (error instanceof Error) {
        if (error.message.includes('OPENAI_API_KEY')) {
          throw error; // Re-throw with original message
        }
        if (error.message.includes('401') || error.message.includes('Incorrect API key')) {
          throw new Error('OpenAI API authentication failed. The API key may be invalid or expired.');
        }
        if (error.message.includes('429')) {
          throw new Error('OpenAI API rate limit exceeded. Please try again later.');
        }
        if (error.message.includes('quota')) {
          throw new Error('OpenAI API quota exceeded. Please check your billing settings.');
        }
      }
      
      throw new Error('Failed to process legal query: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  async conductLegalResearch(request: LegalResearchRequest): Promise<{
    research: string;
    query: string;
    jurisdiction: string;
    searchDepth: string;
    tokensUsed: number;
    generatedAt: string;
  }> {
    try {
      const researchPrompt = `
Conduct comprehensive legal research on: "${request.query}"

Jurisdiction: ${request.jurisdiction}
Search Depth: ${request.searchDepth}
Include: ${[
  request.includeStatutes ? 'Statutes' : null,
  request.includeCaselaw ? 'Case Law' : null,
  request.includeRegulations ? 'Regulations' : null
].filter(Boolean).join(', ')}

Provide:
1. Overview of the legal area
2. Relevant statutes and sections
3. Key case law precedents
4. Current legal position
5. Practical implications
6. Recent developments

Format as structured research brief suitable for legal professionals.
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: this.kenyanLawContext },
          { role: 'user', content: researchPrompt }
        ],
        max_tokens: 2000,
        temperature: 0.2
      });

      const response = completion.choices[0]?.message?.content || 'Research could not be completed';

      return {
        research: response,
        query: request.query,
        jurisdiction: request.jurisdiction,
        searchDepth: request.searchDepth,
        tokensUsed: completion.usage?.total_tokens || 0,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Legal research error:', error);
      throw new Error('Failed to conduct legal research');
    }
  }

  async generateLegalDocument(request: DocumentGenerationRequest): Promise<{
    documentType: string;
    clientName: string;
    content: string;
    parameters: Record<string, unknown>;
    disclaimer: string;
    tokensUsed: number;
    generatedAt: string;
  }> {
    try {
      const documentPrompt = `
Generate a ${request.type} document for ${request.clientName} in Kenya.

Parameters: ${JSON.stringify(request.parameters, null, 2)}
${request.customRequirements ? `Custom Requirements: ${request.customRequirements}` : ''}

Requirements:
1. Comply with Kenyan law and legal standards
2. Include all necessary legal clauses
3. Use appropriate legal language
4. Include standard protective provisions
5. Add placeholders for signatures and dates
6. Include guidance notes where appropriate

Generate a professional, legally sound document template.
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: this.kenyanLawContext + '\n\nYou are generating legal document templates. Always include disclaimers about legal review.'
          },
          { role: 'user', content: documentPrompt }
        ],
        max_tokens: 3000,
        temperature: 0.1
      });

      const documentContent = completion.choices[0]?.message?.content || 'Document could not be generated';

      return {
        documentType: request.type,
        clientName: request.clientName,
        content: documentContent,
        parameters: request.parameters,
        disclaimer: 'This document template should be reviewed by a qualified legal professional before use.',
        tokensUsed: completion.usage?.total_tokens || 0,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Document generation error:', error);
      throw new Error('Failed to generate document');
    }
  }

  async analyzeContract(request: ContractAnalysisRequest): Promise<{
    contractType?: string;
    analysisType: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    analysis: string;
    recommendations: string[];
    disclaimer: string;
    tokensUsed: number;
    analyzedAt: string;
  }> {
    try {
      const analysisPrompt = `
Analyze this contract under Kenyan law:

Contract Type: ${request.contractType || 'General'}
Analysis Type: ${request.analysisType}
Jurisdiction: ${request.jurisdiction}
${request.focusAreas ? `Focus Areas: ${request.focusAreas.join(', ')}` : ''}

Contract Text:
${request.contractText}

Provide detailed analysis including:
1. Overall assessment and risk level
2. Potentially problematic clauses
3. Missing essential provisions
4. Compliance with Kenyan law
5. Fairness assessment
6. Recommendations for improvement
7. Red flags and concerns

Rate the overall contract risk as LOW/MEDIUM/HIGH and explain.
`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: this.kenyanLawContext + '\n\nYou are analyzing contracts for legal risks and compliance.'
          },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 2500,
        temperature: 0.2
      });

      const analysis = completion.choices[0]?.message?.content || 'Contract analysis could not be completed';

      // Extract risk level from response
      const riskLevel = this.extractRiskLevel(analysis);

      return {
        contractType: request.contractType,
        analysisType: request.analysisType,
        riskLevel,
        analysis,
        recommendations: this.extractRecommendations(analysis),
        disclaimer: 'This analysis is for informational purposes. Consult a qualified lawyer for legal advice.',
        tokensUsed: completion.usage?.total_tokens || 0,
        analyzedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Contract analysis error:', error);
      throw new Error('Failed to analyze contract');
    }
  }

  private buildQueryPrompt(request: LegalQueryRequest): string {
    return `
Legal Question: ${request.query}

Query Type: ${request.type}
Urgency: ${request.urgency}
${request.context ? `Additional Context: ${request.context}` : ''}

Please provide:
1. A clear, comprehensive answer based on Kenyan law
2. Relevant legal references and statutes
3. Practical guidance and next steps
4. Appropriate disclaimers about seeking professional advice
${request.includeReferences ? '5. Cite specific legal sources where applicable' : ''}

Keep the response accessible to non-lawyers while being legally accurate.
`;
  }

  private shouldRecommendLawyer(query: string, response: string): boolean {
    // Keywords that indicate complex legal matters requiring professional help
    const complexKeywords = [
      'court', 'litigation', 'lawsuit', 'criminal', 'arrest', 'prosecution',
      'contract dispute', 'property dispute', 'employment termination',
      'divorce', 'custody', 'inheritance', 'will', 'estate',
      'business registration', 'tax liability', 'regulatory compliance'
    ];

    const queryLower = query.toLowerCase();
    const responseLower = response.toLowerCase();

    return complexKeywords.some(keyword => 
      queryLower.includes(keyword) || responseLower.includes(keyword)
    ) || response.length > 800; // Long responses usually indicate complexity
  }

  private calculateConfidence(response: string): number {
    // Simple confidence calculation based on response characteristics
    let confidence = 0.7; // Base confidence

    // Increase confidence if response contains legal references
    if (response.includes('Act') || response.includes('Constitution') || response.includes('Section')) {
      confidence += 0.1;
    }

    // Increase confidence if response has structured format
    if (response.includes('1.') && response.includes('2.')) {
      confidence += 0.1;
    }

    // Decrease confidence if response is very short or contains uncertainty
    if (response.length < 200) {
      confidence -= 0.2;
    }

    if (response.toLowerCase().includes('uncertain') || response.toLowerCase().includes('may vary')) {
      confidence -= 0.1;
    }

    return Math.max(0.1, Math.min(0.95, confidence));
  }

  private extractSources(response: string): Array<{ type: string; title: string; jurisdiction: string }> {
    const sources: Array<{ type: string; title: string; jurisdiction: string }> = [];
    
    // Extract Act references
    const actMatches = response.match(/([A-Z][a-zA-Z\s]+Act\s+\d{4}|\d{4})/g);
    if (actMatches) {
      actMatches.forEach(act => {
        sources.push({
          type: 'statute',
          title: act,
          jurisdiction: 'Kenya'
        });
      });
    }

    // Extract Constitution references
    if (response.toLowerCase().includes('constitution')) {
      sources.push({
        type: 'constitution',
        title: 'Constitution of Kenya 2010',
        jurisdiction: 'Kenya'
      });
    }

    return sources;
  }

  private extractRelatedTopics(query: string): string[] {
    // Simple topic extraction based on keywords
    const topicMap: Record<string, string[]> = {
      'employment': ['Labour Relations', 'Workplace Rights', 'Employment Contracts'],
      'property': ['Land Law', 'Property Rights', 'Real Estate Transactions'],
      'business': ['Company Law', 'Business Registration', 'Commercial Contracts'],
      'family': ['Marriage Law', 'Divorce Proceedings', 'Child Custody'],
      'criminal': ['Criminal Law', 'Legal Procedures', 'Court Processes'],
      'contract': ['Contract Law', 'Agreement Terms', 'Dispute Resolution']
    };

    const queryLower = query.toLowerCase();
    let topics: string[] = [];

    Object.entries(topicMap).forEach(([key, relatedTopics]) => {
      if (queryLower.includes(key)) {
        topics = topics.concat(relatedTopics);
      }
    });

    return topics.length > 0 ? topics.slice(0, 3) : ['General Legal Information', 'Legal Procedures', 'Professional Legal Advice'];
  }

  private extractRiskLevel(analysis: string): 'LOW' | 'MEDIUM' | 'HIGH' {
    const analysisLower = analysis.toLowerCase();
    
    if (analysisLower.includes('high risk') || analysisLower.includes('significant concerns')) {
      return 'HIGH';
    } else if (analysisLower.includes('medium risk') || analysisLower.includes('moderate concerns')) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }

  private extractRecommendations(analysis: string): string[] {
    const recommendations: string[] = [];
    
    // Extract numbered recommendations
    const matches = analysis.match(/\d+\.\s*([^.]+)/g);
    if (matches) {
      matches.forEach(match => {
        const recommendation = match.replace(/^\d+\.\s*/, '').trim();
        if (recommendation.length > 10) {
          recommendations.push(recommendation);
        }
      });
    }

    return recommendations.slice(0, 5); // Limit to 5 recommendations
  }
}

export const kenyanLawService = new KenyanLawService();