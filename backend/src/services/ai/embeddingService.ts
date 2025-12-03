/**
 * Embedding Service - Generate text embeddings using OpenAI with Gemini fallback
 * Handles text chunking and batch processing for RAG system
 */

import { OpenAI } from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { encoding_for_model } from 'tiktoken';
import { logger } from '../../utils/logger';

interface TextChunk {
  text: string;
  index: number;
  tokens: number;
}

interface EmbeddingResult {
  embedding: number[];
  text: string;
  index: number;
}

class EmbeddingService {
  private openai: OpenAI;
  private gemini: GoogleGenerativeAI | null = null;
  private embeddingModel: string;
  private chunkSize: number;
  private chunkOverlap: number;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }

    this.openai = new OpenAI({ apiKey });
    
    // Initialize Gemini if available
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      this.gemini = new GoogleGenerativeAI(geminiKey);
      logger.info('✅ Gemini fallback embeddings enabled');
    } else {
      logger.warn('⚠️ GEMINI_API_KEY not found - will use basic fallback if OpenAI fails');
    }
    
    this.embeddingModel = process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-3-small';
    this.chunkSize = parseInt(process.env.CHUNK_SIZE || '1000');
    this.chunkOverlap = parseInt(process.env.CHUNK_OVERLAP || '200');
  }

  /**
   * Split text into chunks with overlap
   */
  chunkText(text: string): TextChunk[] {
    try {
      const enc = encoding_for_model('gpt-3.5-turbo');
      const tokens = enc.encode(text);
      enc.free();

      const chunks: TextChunk[] = [];
      let startIdx = 0;

      while (startIdx < tokens.length) {
        const endIdx = Math.min(startIdx + this.chunkSize, tokens.length);
        const chunkTokens = tokens.slice(startIdx, endIdx);
        
        // Decode tokens back to text
        const enc2 = encoding_for_model('gpt-3.5-turbo');
        const chunkText = new TextDecoder().decode(enc2.decode(chunkTokens));
        enc2.free();

        chunks.push({
          text: chunkText.trim(),
          index: chunks.length,
          tokens: chunkTokens.length,
        });

        // Move start index forward with overlap
        startIdx += this.chunkSize - this.chunkOverlap;
      }

      logger.info(`Split text into ${chunks.length} chunks (avg ${Math.round(text.length / chunks.length)} chars per chunk)`);
      return chunks;
    } catch (error) {
      logger.error('Error chunking text:', error);
      // Fallback to simple character-based chunking
      return this.simpleChunkText(text);
    }
  }

  /**
   * Fallback simple chunking if tiktoken fails
   */
  private simpleChunkText(text: string): TextChunk[] {
    const chunks: TextChunk[] = [];
    const charChunkSize = this.chunkSize * 4; // Approximate chars per token
    const charOverlap = this.chunkOverlap * 4;

    let startIdx = 0;
    while (startIdx < text.length) {
      const endIdx = Math.min(startIdx + charChunkSize, text.length);
      const chunkText = text.substring(startIdx, endIdx);

      chunks.push({
        text: chunkText.trim(),
        index: chunks.length,
        tokens: Math.ceil(chunkText.length / 4),
      });

      startIdx += charChunkSize - charOverlap;
    }

    return chunks;
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
      });

      return response.data[0].embedding;
    } catch (error: any) {
      // Check if it's a quota error (429)
      if (error?.status === 429 || error?.message?.includes('quota')) {
        logger.warn('⚠️ OpenAI quota exceeded, trying Gemini fallback...');
        
        // Try Gemini first if available
        if (this.gemini) {
          try {
            return await this.generateGeminiEmbedding(text);
          } catch (geminiError) {
            logger.error('Gemini also failed:', geminiError);
          }
        }
        
        // Last resort: hash-based fallback
        return this.generateFallbackEmbedding(text);
      }
      logger.error('Error generating embedding:', error);
      throw error;
    }
  }

  /**
   * Generate embedding using Gemini
   */
  private async generateGeminiEmbedding(text: string): Promise<number[]> {
    if (!this.gemini) {
      throw new Error('Gemini not initialized');
    }

    try {
      const model = this.gemini.getGenerativeModel({ model: 'embedding-001' });
      const result = await model.embedContent(text);
      const embedding = result.embedding.values;

      // Gemini embeddings are 768 dimensions, pad to 1536 for Pinecone compatibility
      if (embedding.length === 768) {
        return [...embedding, ...new Array(768).fill(0)];
      }

      return embedding;
    } catch (error) {
      logger.error('Error generating Gemini embedding:', error);
      throw error;
    }
  }

  /**
   * Fallback embedding generator (hash-based for testing)
   * NOTE: This is NOT suitable for production - only for testing when both APIs fail
   */
  private generateFallbackEmbedding(text: string): number[] {
    logger.warn('⚠️ USING BASIC FALLBACK EMBEDDINGS - Add OpenAI/Gemini credits for proper functionality');
    
    // Generate 1536-dimensional vector from text hash (matches text-embedding-3-small)
    const embedding = new Array(1536).fill(0);
    
    // Simple deterministic hash-based embedding
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      const idx = (char * (i + 1)) % 1536;
      embedding[idx] = (embedding[idx] + (char / 255)) % 1;
    }
    
    // Normalize to unit vector
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateEmbeddingsBatch(texts: string[]): Promise<EmbeddingResult[]> {
    try {
      // OpenAI allows max 2048 inputs per request for embeddings
      const batchSize = 100; // Conservative batch size
      const results: EmbeddingResult[] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        
        logger.info(`Generating embeddings for batch ${i / batchSize + 1} (${batch.length} texts)`);
        
        try {
          const response = await this.openai.embeddings.create({
            model: this.embeddingModel,
            input: batch,
          });

          const batchResults = response.data.map((item, idx) => ({
            embedding: item.embedding,
            text: batch[idx],
            index: i + idx,
          }));

          results.push(...batchResults);
        } catch (error: any) {
          // Check if it's a quota error
          if (error?.status === 429 || error?.message?.includes('quota')) {
            logger.warn(`⚠️ OpenAI quota exceeded in batch ${i / batchSize + 1}, trying Gemini fallback...`);
            
            // Try Gemini for this batch
            if (this.gemini) {
              try {
                const geminiResults = [];
                for (let j = 0; j < batch.length; j++) {
                  const embedding = await this.generateGeminiEmbedding(batch[j]);
                  geminiResults.push({
                    embedding,
                    text: batch[j],
                    index: i + j,
                  });
                }
                results.push(...geminiResults);
                logger.info(`✅ Gemini fallback successful for batch ${i / batchSize + 1}`);
                continue; // Skip to next batch
              } catch (geminiError) {
                logger.error('Gemini batch fallback failed:', geminiError);
              }
            }
            
            // Last resort: hash-based fallback
            logger.warn(`Using hash-based fallback for batch ${i / batchSize + 1}`);
            const fallbackResults = batch.map((text, idx) => ({
              embedding: this.generateFallbackEmbedding(text),
              text,
              index: i + idx,
            }));
            results.push(...fallbackResults);
          } else {
            throw error;
          }
        }

        // Add small delay to avoid rate limits
        if (i + batchSize < texts.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      logger.info(`Generated ${results.length} embeddings successfully`);
      return results;
    } catch (error) {
      logger.error('Error generating batch embeddings:', error);
      throw error;
    }
  }

  /**
   * Process document: chunk and generate embeddings
   */
  async processDocument(text: string): Promise<EmbeddingResult[]> {
    try {
      // Split into chunks
      const chunks = this.chunkText(text);
      
      // Generate embeddings for all chunks
      const embeddings = await this.generateEmbeddingsBatch(chunks.map(c => c.text));
      
      logger.info(`Processed document: ${chunks.length} chunks, ${embeddings.length} embeddings`);
      return embeddings;
    } catch (error) {
      logger.error('Error processing document:', error);
      throw error;
    }
  }

  /**
   * Count tokens in text
   */
  countTokens(text: string): number {
    try {
      const enc = encoding_for_model('gpt-3.5-turbo');
      const tokens = enc.encode(text);
      const count = tokens.length;
      enc.free();
      return count;
    } catch (error) {
      // Fallback: estimate 1 token ≈ 4 characters
      return Math.ceil(text.length / 4);
    }
  }
}

// Export singleton instance
export const embeddingService = new EmbeddingService();
