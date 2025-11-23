/**
 * Vector Database Service - Pinecone Integration
 * Handles vector storage and semantic search for RAG system
 */

import { Pinecone, RecordMetadata } from '@pinecone-database/pinecone';
import { logger } from '../../utils/logger';

interface VectorMetadata extends RecordMetadata {
  documentId: string;
  chunkIndex: number;
  documentTitle: string;
  documentType: string;
  category: string;
  citation?: string;
  section?: string;
  text: string;
  [key: string]: any;
}

interface SearchResult {
  id: string;
  score: number;
  metadata: VectorMetadata;
}

class VectorDatabaseService {
  private pinecone: Pinecone | null = null;
  private indexName: string;
  private isInitialized = false;

  constructor() {
    this.indexName = process.env.PINECONE_INDEX_NAME || 'wakili-legal-kb';
  }

  /**
   * Initialize Pinecone client
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const apiKey = process.env.PINECONE_API_KEY;
      
      if (!apiKey) {
        throw new Error('PINECONE_API_KEY not found in environment variables');
      }

      this.pinecone = new Pinecone({
        apiKey,
      });

      // Check if index exists, create if not
      await this.ensureIndexExists();
      
      this.isInitialized = true;
      logger.info('Pinecone vector database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Pinecone:', error);
      throw error;
    }
  }

  /**
   * Ensure Pinecone index exists, create if not
   */
  private async ensureIndexExists(): Promise<void> {
    if (!this.pinecone) throw new Error('Pinecone client not initialized');

    try {
      const indexes = await this.pinecone.listIndexes();
      const indexExists = indexes.indexes?.some(idx => idx.name === this.indexName);

      if (!indexExists) {
        logger.info(`Creating Pinecone index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // text-embedding-3-small dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: process.env.PINECONE_ENVIRONMENT || 'us-east-1',
            },
          },
        });
        logger.info(`Index ${this.indexName} created successfully`);
      }
    } catch (error) {
      logger.error('Error ensuring index exists:', error);
      throw error;
    }
  }

  /**
   * Upsert vectors to Pinecone
   */
  async upsertVectors(
    vectors: Array<{
      id: string;
      values: number[];
      metadata: VectorMetadata;
    }>,
    namespace?: string
  ): Promise<void> {
    if (!this.pinecone) await this.initialize();

    try {
      const index = this.pinecone!.index(this.indexName);
      
      // Batch upsert in chunks of 100
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);
        await index.namespace(namespace || 'default').upsert(batch);
        logger.info(`Upserted batch ${i / batchSize + 1} (${batch.length} vectors)`);
      }

      logger.info(`Successfully upserted ${vectors.length} vectors to Pinecone`);
    } catch (error) {
      logger.error('Failed to upsert vectors:', error);
      throw error;
    }
  }

  /**
   * Search for similar vectors
   */
  async searchSimilar(
    queryVector: number[],
    topK: number = 5,
    namespace?: string,
    filter?: Record<string, any>
  ): Promise<SearchResult[]> {
    if (!this.pinecone) await this.initialize();

    try {
      const index = this.pinecone!.index(this.indexName);
      
      const queryResponse = await index.namespace(namespace || 'default').query({
        vector: queryVector,
        topK,
        includeMetadata: true,
        filter,
      });

      const results: SearchResult[] = queryResponse.matches?.map(match => ({
        id: match.id,
        score: match.score || 0,
        metadata: match.metadata as unknown as VectorMetadata,
      })) || [];

      logger.info(`Found ${results.length} similar vectors with scores: ${results.map(r => r.score.toFixed(3)).join(', ')}`);
      
      return results;
    } catch (error) {
      logger.error('Failed to search vectors:', error);
      throw error;
    }
  }

  /**
   * Delete vectors by document ID
   */
  async deleteByDocumentId(documentId: string, namespace?: string): Promise<void> {
    if (!this.pinecone) await this.initialize();

    try {
      const index = this.pinecone!.index(this.indexName);
      
      await index.namespace(namespace || 'default').deleteMany({
        filter: { documentId },
      });

      logger.info(`Deleted all vectors for document: ${documentId}`);
    } catch (error) {
      logger.error('Failed to delete vectors:', error);
      throw error;
    }
  }

  /**
   * Delete specific vector by ID
   */
  async deleteVector(vectorId: string, namespace?: string): Promise<void> {
    if (!this.pinecone) await this.initialize();

    try {
      const index = this.pinecone!.index(this.indexName);
      
      await index.namespace(namespace || 'default').deleteOne(vectorId);

      logger.info(`Deleted vector: ${vectorId}`);
    } catch (error) {
      logger.error('Failed to delete vector:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getStats(namespace?: string): Promise<any> {
    if (!this.pinecone) await this.initialize();

    try {
      const index = this.pinecone!.index(this.indexName);
      const stats = await index.describeIndexStats();
      
      logger.info('Index stats:', stats);
      return stats;
    } catch (error) {
      logger.error('Failed to get index stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const vectorDbService = new VectorDatabaseService();
