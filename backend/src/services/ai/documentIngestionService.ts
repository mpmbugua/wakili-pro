/**
 * Document Ingestion Service
 * Process legal documents (PDF, DOCX, HTML) and store in vector database
 */

import mammoth from 'mammoth';
import * as cheerio from 'cheerio';
import { PrismaClient, LegalDocumentType } from '@prisma/client';
import { embeddingService } from './embeddingService';
import { vectorDbService } from './vectorDatabaseService';
import { logger } from '../../utils/logger';
import { readFile } from 'fs/promises';
// Use require for pdfjs-dist to avoid ES6/CommonJS issues
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

const prisma = new PrismaClient();

interface DocumentMetadata {
  title: string;
  documentType: LegalDocumentType;
  category: string;
  citation?: string;
  sourceUrl?: string;
  effectiveDate?: Date;
  uploadedBy: string; // User ID who uploaded the document
}

interface IngestionResult {
  documentId: string;
  chunksProcessed: number;
  vectorsCreated: number;
}

class DocumentIngestionService {
  /**
   * Extract text from PDF file
   */
  private async extractPdfText(filepath: string): Promise<string> {
    try {
      const dataBuffer = await readFile(filepath);
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(dataBuffer) });
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      
      return fullText.trim();
    } catch (error) {
      logger.error('Error extracting PDF text:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Extract text from DOCX file
   */
  async extractDocxText(filepath: string): Promise<string> {
    try {
      const result = await mammoth.extractRawText({ path: filepath });
      return result.value;
    } catch (error) {
      logger.error('Error extracting DOCX text:', error);
      throw new Error('Failed to extract text from DOCX');
    }
  }

  /**
   * Extract text from HTML content
   */
  extractHtmlText(html: string): string {
    try {
      const $ = cheerio.load(html);
      // Remove script and style elements
      $('script, style').remove();
      // Get text content
      return $('body').text().trim().replace(/\s+/g, ' ');
    } catch (error) {
      logger.error('Error extracting HTML text:', error);
      throw new Error('Failed to extract text from HTML');
    }
  }

  /**
   * Ingest document from file
   */
  async ingestDocumentFile(
    filepath: string,
    fileType: 'pdf' | 'docx',
    metadata: DocumentMetadata
  ): Promise<IngestionResult> {
    try {
      logger.info(`Starting ingestion of ${fileType} document: ${metadata.title}`);

      // Extract text based on file type
      let text: string;
      if (fileType === 'pdf') {
        text = await this.extractPdfText(filepath);
      } else if (fileType === 'docx') {
        text = await this.extractDocxText(filepath);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Clean and validate text
      text = text.trim();
      if (text.length < 100) {
        throw new Error('Extracted text is too short (minimum 100 characters)');
      }

      logger.info(`Extracted ${text.length} characters from document`);

      // Process document
      return await this.ingestDocumentText(text, metadata);
    } catch (error) {
      logger.error('Error ingesting document file:', error);
      throw error;
    }
  }

  /**
   * Ingest document from text content
   */
  async ingestDocumentText(
    text: string,
    metadata: DocumentMetadata
  ): Promise<IngestionResult> {
    try {
      // Create legal document record
      const document = await prisma.legalDocument.create({
        data: {
          title: metadata.title,
          documentType: metadata.documentType,
          category: metadata.category,
          citation: metadata.citation,
          sourceUrl: metadata.sourceUrl,
          effectiveDate: metadata.effectiveDate,
          uploadedBy: metadata.uploadedBy,
          // File metadata will be added later via update
          filePath: '',
          fileName: '',
          fileSize: 0
        },
      });

      logger.info(`Created legal document record: ${document.id}`);

      // Process document: chunk and generate embeddings
      const embeddings = await embeddingService.processDocument(text);

      logger.info(`Generated ${embeddings.length} embeddings for document`);

      // Prepare vectors for Pinecone
      const vectors = embeddings.map((emb, idx) => ({
        id: `${document.id}-chunk-${idx}`,
        values: emb.embedding,
        metadata: {
          documentId: document.id,
          chunkIndex: idx,
          documentTitle: metadata.title,
          documentType: metadata.documentType,
          category: metadata.category,
          citation: metadata.citation || '',
          text: emb.text,
        },
      }));

      // Upload to Pinecone
      await vectorDbService.upsertVectors(vectors);

      // Store embedding records in database
      const embeddingRecords = await Promise.all(
        embeddings.map((emb, idx) =>
          prisma.documentEmbedding.create({
            data: {
              documentId: document.id,
              chunkText: emb.text,
              chunkIndex: idx,
              vectorId: `${document.id}-chunk-${idx}`,
              metadata: {
                tokens: embeddingService.countTokens(emb.text),
                section: this.extractSection(emb.text),
              },
            },
          })
        )
      );

      logger.info(`Successfully ingested document: ${document.id} (${embeddings.length} chunks)`);

      return {
        documentId: document.id,
        chunksProcessed: embeddings.length,
        vectorsCreated: vectors.length,
      };
    } catch (error) {
      logger.error('Error ingesting document text:', error);
      throw error;
    }
  }

  /**
   * Delete document and all its embeddings
   */
  async deleteDocument(documentId: string): Promise<void> {
    try {
      // Delete from vector database
      await vectorDbService.deleteByDocumentId(documentId);

      // Delete from PostgreSQL (cascades to embeddings)
      await prisma.legalDocument.delete({
        where: { id: documentId },
      });

      logger.info(`Deleted document: ${documentId}`);
    } catch (error) {
      logger.error('Error deleting document:', error);
      throw error;
    }
  }

  /**
   * List all indexed documents
   */
  async listDocuments(options?: {
    documentType?: LegalDocumentType;
    category?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const documents = await prisma.legalDocument.findMany({
        where: {
          ...(options?.documentType && { documentType: options.documentType }),
          ...(options?.category && { category: options.category }),
        },
        include: {
          _count: {
            select: { embeddings: true },
          },
        },
        orderBy: { uploadedAt: 'desc' },
        take: options?.limit || 50,
      });

      return documents;
    } catch (error) {
      logger.error('Error listing documents:', error);
      throw error;
    }
  }

  /**
   * Extract section/article number from text (e.g., "Section 49", "Article 25")
   */
  private extractSection(text: string): string | null {
    const sectionMatch = text.match(/(?:Section|Article|Chapter|Part)\s+(\d+[A-Za-z]?(?:\(\d+\))?)/i);
    return sectionMatch ? sectionMatch[0] : null;
  }

  /**
   * Get document statistics
   */
  async getStats(): Promise<any> {
    try {
      const totalDocs = await prisma.legalDocument.count();
      const totalChunks = await prisma.documentEmbedding.count();
      
      const byType = await prisma.legalDocument.groupBy({
        by: ['documentType'],
        _count: true,
      });

      const byCategory = await prisma.legalDocument.groupBy({
        by: ['category'],
        _count: true,
      });

      return {
        totalDocuments: totalDocs,
        totalChunks,
        byType,
        byCategory,
      };
    } catch (error) {
      logger.error('Error getting document stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const documentIngestionService = new DocumentIngestionService();
