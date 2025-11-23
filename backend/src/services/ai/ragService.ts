/**
 * RAG (Retrieval Augmented Generation) Service
 * Orchestrates retrieval from vector DB and generation with GPT
 */

import { OpenAI } from 'openai';
import { embeddingService } from './embeddingService';
import { vectorDbService } from './vectorDatabaseService';
import { logger } from '../../utils/logger';

interface RAGContext {
  sources: Array<{
    documentId: string;
    title: string;
    text: string;
    citation?: string;
    section?: string;
    score: number;
  }>;
  retrievedCount: number;
  avgConfidence: number;
}

interface RAGResponse {
  answer: string;
  context: RAGContext;
  tokensUsed: number;
  modelUsed: string;
  confidence: number;
}

class RAGService {
  private openai: OpenAI;
  private maxRetrievalDocs: number;
  private similarityThreshold: number;
  private highConfidenceThreshold: number;
  private useGPT35ForHighConfidence: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    this.openai = new OpenAI({ apiKey });
    this.maxRetrievalDocs = parseInt(process.env.MAX_RETRIEVAL_DOCS || '5');
    this.similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7');
    this.highConfidenceThreshold = parseFloat(process.env.HIGH_CONFIDENCE_THRESHOLD || '0.85');
    this.useGPT35ForHighConfidence = process.env.USE_GPT35_FOR_HIGH_CONFIDENCE === 'true';
  }

  /**
   * Retrieve relevant documents from vector database
   */
  async retrieveContext(query: string): Promise<RAGContext> {
    try {
      // Generate embedding for query
      const queryEmbedding = await embeddingService.generateEmbedding(query);

      // Search vector database
      const results = await vectorDbService.searchSimilar(
        queryEmbedding,
        this.maxRetrievalDocs
      );

      // Filter by similarity threshold
      const filteredResults = results.filter(r => r.score >= this.similarityThreshold);

      if (filteredResults.length === 0) {
        logger.warn(`No documents found above similarity threshold (${this.similarityThreshold})`);
      }

      // Build context
      const sources = filteredResults.map(result => ({
        documentId: result.metadata.documentId,
        title: result.metadata.documentTitle,
        text: result.metadata.text,
        citation: result.metadata.citation,
        section: result.metadata.section,
        score: result.score,
      }));

      const avgConfidence = sources.length > 0
        ? sources.reduce((sum, s) => sum + s.score, 0) / sources.length
        : 0;

      logger.info(`Retrieved ${sources.length} relevant documents (avg confidence: ${avgConfidence.toFixed(3)})`);

      return {
        sources,
        retrievedCount: sources.length,
        avgConfidence,
      };
    } catch (error) {
      logger.error('Error retrieving context:', error);
      throw error;
    }
  }

  /**
   * Generate answer using GPT with retrieved context
   */
  async generateAnswer(
    query: string,
    context: RAGContext,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<RAGResponse> {
    try {
      const useGPT4 = context.avgConfidence < this.highConfidenceThreshold || !this.useGPT35ForHighConfidence;
      const model = useGPT4
        ? (process.env.OPENAI_CHAT_MODEL_COMPLEX || 'gpt-4')
        : (process.env.OPENAI_CHAT_MODEL_SIMPLE || 'gpt-3.5-turbo');

      logger.info(`Using model: ${model} (confidence: ${context.avgConfidence.toFixed(3)})`);

      // Build system prompt with context
      const systemPrompt = this.buildSystemPrompt(context);

      // Build messages array
      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      // Add conversation history if provided (last 5 messages)
      if (conversationHistory && conversationHistory.length > 0) {
        const recentHistory = conversationHistory.slice(-5);
        messages.push(...recentHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })));
      }

      // Add current query
      messages.push({ role: 'user', content: query });

      // Call OpenAI
      const response = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: 0.3, // Lower temperature for factual legal responses
        max_tokens: 1500,
      });

      const answer = response.choices[0].message.content || 'I apologize, but I could not generate a response.';
      const tokensUsed = response.usage?.total_tokens || 0;

      logger.info(`Generated answer using ${model} (${tokensUsed} tokens)`);

      return {
        answer,
        context,
        tokensUsed,
        modelUsed: model,
        confidence: context.avgConfidence,
      };
    } catch (error) {
      logger.error('Error generating answer:', error);
      throw error;
    }
  }

  /**
   * Complete RAG pipeline: retrieve + generate
   */
  async query(
    userQuery: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<RAGResponse> {
    try {
      logger.info(`RAG query: "${userQuery.substring(0, 100)}..."`);

      // Step 1: Retrieve relevant context
      const context = await this.retrieveContext(userQuery);

      // Step 2: Generate answer with context
      const response = await this.generateAnswer(userQuery, context, conversationHistory);

      logger.info(`RAG query completed successfully (${response.context.retrievedCount} sources, ${response.tokensUsed} tokens)`);

      return response;
    } catch (error) {
      logger.error('RAG query failed:', error);
      throw error;
    }
  }

  /**
   * Fallback to GPT without RAG (when retrieval fails or returns no results)
   */
  async queryWithoutRAG(
    userQuery: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<RAGResponse> {
    try {
      logger.info('Falling back to GPT without RAG');

      const model = process.env.OPENAI_CHAT_MODEL_COMPLEX || 'gpt-4';

      const systemPrompt = `You are an expert legal assistant specializing in Kenyan law. 
Provide accurate, helpful information about Kenyan legal matters.
Always cite specific laws, acts, and articles when possible.
If you're uncertain, clearly state that and recommend consulting a licensed advocate.`;

      const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: systemPrompt },
      ];

      if (conversationHistory && conversationHistory.length > 0) {
        messages.push(...conversationHistory.slice(-5).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })));
      }

      messages.push({ role: 'user', content: userQuery });

      const response = await this.openai.chat.completions.create({
        model,
        messages,
        temperature: 0.3,
        max_tokens: 1500,
      });

      const answer = response.choices[0].message.content || 'I apologize, but I could not generate a response.';
      const tokensUsed = response.usage?.total_tokens || 0;

      return {
        answer,
        context: {
          sources: [],
          retrievedCount: 0,
          avgConfidence: 0,
        },
        tokensUsed,
        modelUsed: model,
        confidence: 0,
      };
    } catch (error) {
      logger.error('Error in fallback query:', error);
      throw error;
    }
  }

  /**
   * Build system prompt with retrieved context
   */
  private buildSystemPrompt(context: RAGContext): string {
    let prompt = `You are an expert legal assistant specializing in Kenyan law.

I have retrieved the following relevant legal documents to help answer the user's question:

`;

    context.sources.forEach((source, idx) => {
      prompt += `\n--- SOURCE ${idx + 1} ---\n`;
      prompt += `Document: ${source.title}\n`;
      if (source.citation) prompt += `Citation: ${source.citation}\n`;
      if (source.section) prompt += `Section: ${source.section}\n`;
      prompt += `Relevance Score: ${(source.score * 100).toFixed(1)}%\n`;
      prompt += `\nContent:\n${source.text}\n`;
    });

    prompt += `\n\n--- INSTRUCTIONS ---
Based on the above legal documents, provide a comprehensive answer to the user's question.

IMPORTANT:
- Cite specific laws, acts, sections, and articles from the provided documents
- Use exact legal language when quoting statutes
- If the provided documents don't fully answer the question, clearly state what information is missing
- Include procedural steps, timelines, costs, and requirements where relevant
- Format your response with clear headings and bullet points for readability
- End with a recommendation to consult a licensed advocate for personalized legal advice

Always prioritize accuracy over completeness. If you're uncertain, say so.`;

    return prompt;
  }
}

// Export singleton instance
export const ragService = new RAGService();
