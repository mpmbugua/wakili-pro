import { Router, Response } from 'express';
import { AuthRequest } from '../../types/auth';
import { vectorDbService } from '../../services/ai/vectorDatabaseService';
import { embeddingService } from '../../services/ai/embeddingService';
import { logger } from '../../utils/logger';
import { authenticateToken, authorizeRoles } from '../../middleware/auth';

const router = Router();

/**
 * @route   GET /api/admin/pinecone/test-connection
 * @desc    Test Pinecone connection and configuration
 * @access  Admin only
 */
router.get('/test-connection', authenticateToken, authorizeRoles('ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    logger.info('[Pinecone Test] Starting connection test...');

    // Step 1: Check environment variables
    const envCheck = {
      apiKey: !!process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT || 'NOT_SET',
      indexName: process.env.PINECONE_INDEX_NAME || 'NOT_SET',
      host: process.env.PINECONE_HOST || 'NOT_SET',
    };

    logger.info('[Pinecone Test] Environment variables:', envCheck);

    // Step 2: Initialize Pinecone
    try {
      await vectorDbService.initialize();
      logger.info('[Pinecone Test] ✅ Initialization successful');
    } catch (initError: any) {
      logger.error('[Pinecone Test] ❌ Initialization failed:', initError);
      return res.status(500).json({
        success: false,
        message: 'Pinecone initialization failed',
        error: initError.message,
        envCheck
      });
    }

    // Step 3: Get index stats
    let stats;
    try {
      stats = await vectorDbService.getStats();
      logger.info('[Pinecone Test] ✅ Stats retrieved:', stats);
    } catch (statsError: any) {
      logger.error('[Pinecone Test] ❌ Failed to get stats:', statsError);
      return res.status(500).json({
        success: false,
        message: 'Failed to get Pinecone stats',
        error: statsError.message,
        envCheck
      });
    }

    // Step 4: Test embedding generation
    let testEmbedding;
    try {
      testEmbedding = await embeddingService.generateEmbedding('This is a test document.');
      logger.info('[Pinecone Test] ✅ Test embedding generated (dimension:', testEmbedding.length, ')');
    } catch (embedError: any) {
      logger.error('[Pinecone Test] ❌ Embedding generation failed:', embedError);
      return res.status(500).json({
        success: false,
        message: 'Embedding generation failed',
        error: embedError.message,
        envCheck,
        stats
      });
    }

    // Step 5: Test vector upsert
    const testVectorId = `test-${Date.now()}`;
    try {
      await vectorDbService.upsertVectors([
        {
          id: testVectorId,
          values: testEmbedding,
          metadata: {
            documentId: 'test-doc-123',
            chunkIndex: 0,
            documentTitle: 'Test Document',
            documentType: 'LEGISLATION',
            category: 'Test',
            text: 'This is a test document for Pinecone connection verification.'
          }
        }
      ]);
      logger.info('[Pinecone Test] ✅ Test vector upserted successfully');
    } catch (upsertError: any) {
      logger.error('[Pinecone Test] ❌ Vector upsert failed:', upsertError);
      return res.status(500).json({
        success: false,
        message: 'Vector upsert failed',
        error: upsertError.message,
        envCheck,
        stats,
        embedding: { dimension: testEmbedding.length }
      });
    }

    // Step 6: Test search
    let searchResults;
    try {
      searchResults = await vectorDbService.searchSimilar(testEmbedding, 3);
      logger.info('[Pinecone Test] ✅ Search successful, found', searchResults.length, 'results');
    } catch (searchError: any) {
      logger.error('[Pinecone Test] ❌ Search failed:', searchError);
      return res.status(500).json({
        success: false,
        message: 'Vector search failed',
        error: searchError.message,
        envCheck,
        stats,
        embedding: { dimension: testEmbedding.length }
      });
    }

    // Step 7: Cleanup test vector
    try {
      await vectorDbService.deleteVector(testVectorId);
      logger.info('[Pinecone Test] ✅ Test vector deleted');
    } catch (deleteError: any) {
      logger.warn('[Pinecone Test] ⚠️ Failed to delete test vector:', deleteError.message);
    }

    // All tests passed!
    return res.json({
      success: true,
      message: 'Pinecone connection test PASSED ✅',
      results: {
        environment: envCheck,
        indexStats: stats,
        embedding: {
          dimension: testEmbedding.length,
          expected: 1536,
          match: testEmbedding.length === 1536
        },
        vectorOperations: {
          upsert: 'SUCCESS',
          search: 'SUCCESS',
          searchResults: searchResults.length,
          delete: 'SUCCESS'
        },
        recommendations: testEmbedding.length !== 1536 
          ? ['⚠️ Embedding dimension mismatch! Expected 1536, got ' + testEmbedding.length]
          : ['✅ All systems operational']
      }
    });

  } catch (error: any) {
    logger.error('[Pinecone Test] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'Pinecone test failed with unexpected error',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * @route   POST /api/admin/pinecone/test-upload
 * @desc    Test document upload with minimal PDF
 * @access  Admin only
 */
router.post('/test-upload', authenticateToken, authorizeRoles('ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { documentIngestionService } = await import('../../services/ai/documentIngestionService');
    
    // Test with sample text
    const testText = `
      TEST LEGAL DOCUMENT
      
      Section 1: Introduction
      This is a test legal document for verifying the document ingestion pipeline.
      
      Section 2: Purpose
      The purpose of this test is to ensure that:
      1. Text extraction works correctly
      2. Document chunking functions properly
      3. Embeddings are generated successfully
      4. Vectors are stored in Pinecone
      5. Database records are created correctly
      
      Section 3: Conclusion
      If you can see this document in the admin panel, the ingestion system is working!
    `.trim();

    logger.info('[Test Upload] Starting test ingestion...');

    const result = await documentIngestionService.ingestDocumentText(testText, {
      title: 'Test Document - ' + new Date().toISOString(),
      documentType: 'LEGISLATION',
      category: 'Testing',
      citation: 'TEST-2025-001',
      uploadedBy: (req as any).user.id
    });

    logger.info('[Test Upload] ✅ Test document ingested successfully');

    return res.json({
      success: true,
      message: 'Test document uploaded successfully',
      data: result
    });

  } catch (error: any) {
    logger.error('[Test Upload] Error:', error);     
    return res.status(500).json({
      success: false,
      message: 'Test upload failed',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * @route   POST /api/admin/pinecone/sync-metadata
 * @desc    Sync database metadata from Pinecone vectors
 * @access  Admin only
 */
router.post('/sync-metadata', authenticateToken, authorizeRoles('ADMIN', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    logger.info('[Metadata Sync] Starting sync from Pinecone to database...');

    // Import the sync function
    const { syncMetadataFromPinecone } = await import('../../scripts/syncPineconeMetadata');

    // Run the sync
    await syncMetadataFromPinecone();

    logger.info('[Metadata Sync] ✅ Sync completed successfully');

    return res.json({
      success: true,
      message: 'Metadata synced successfully from Pinecone to database'
    });

  } catch (error: any) {
    logger.error('[Metadata Sync] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Metadata sync failed',
      error: error.message,
      stack: error.stack
    });
  }
});

export default router;

