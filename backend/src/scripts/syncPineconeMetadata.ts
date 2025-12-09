/**
 * Sync Database Metadata from Pinecone
 * 
 * This script queries all vectors from Pinecone, extracts their metadata,
 * and recreates the corresponding LegalDocument records in the database.
 */

import { PrismaClient } from '@prisma/client';
import { Pinecone } from '@pinecone-database/pinecone';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

interface PineconeMetadata {
  documentId?: string;
  title?: string;
  documentType?: string;
  category?: string;
  citation?: string;
  sourceUrl?: string;
  effectiveDate?: string;
  chunkIndex?: number;
  totalChunks?: number;
  uploadedAt?: string;
  uploadedBy?: string;
}

async function syncMetadataFromPinecone() {
  console.log('🔄 Starting Pinecone → Database metadata sync...\n');

  try {
    // Initialize Pinecone
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!
    });
    const index = pinecone.index(process.env.PINECONE_INDEX_NAME!);

    // Get index stats
    const stats = await index.describeIndexStats();
    console.log(`📊 Pinecone Index Stats:`);
    console.log(`   Total Vectors: ${stats.totalRecordCount}`);
    console.log(`   Dimension: ${stats.dimension}\n`);

    if (stats.totalRecordCount === 0) {
      console.log('⚠️  No vectors found in Pinecone. Nothing to sync.');
      return;
    }

    // Query all vectors with metadata
    // Pinecone doesn't have a "list all" API, so we use a dummy query with high topK
    console.log('🔍 Querying vectors from Pinecone...');
    
    const dummyVector = new Array(stats.dimension).fill(0.01);
    const queryResponse = await index.query({
      vector: dummyVector,
      topK: 10000, // Get as many as possible
      includeMetadata: true
    });

    console.log(`   Retrieved ${queryResponse.matches.length} vectors\n`);

    // Group vectors by documentId
    const documentMap = new Map<string, {
      metadata: PineconeMetadata;
      chunkCount: number;
      vectorIds: string[];
    }>();

    for (const match of queryResponse.matches) {
      const metadata = match.metadata as PineconeMetadata;
      const docId = metadata.documentId || match.id.split('-chunk-')[0];

      if (!documentMap.has(docId)) {
        documentMap.set(docId, {
          metadata,
          chunkCount: 0,
          vectorIds: []
        });
      }

      const doc = documentMap.get(docId)!;
      doc.chunkCount++;
      doc.vectorIds.push(match.id);
    }

    console.log(`📚 Found ${documentMap.size} unique documents\n`);

    // Check existing documents in database
    const existingDocs = await prisma.legalDocument.findMany({
      select: { id: true, title: true }
    });
    console.log(`💾 Current DB records: ${existingDocs.length}\n`);

    // Recreate database records
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const [docId, docInfo] of documentMap.entries()) {
      const { metadata, chunkCount, vectorIds } = docInfo;

      try {
        // Check if document already exists
        const existing = await prisma.legalDocument.findUnique({
          where: { id: docId }
        });

        const documentData = {
          title: metadata.title || 'Untitled Document',
          documentType: metadata.documentType || 'LEGISLATION',
          category: metadata.category || 'General Law',
          citation: metadata.citation,
          sourceUrl: metadata.sourceUrl,
          effectiveDate: metadata.effectiveDate ? new Date(metadata.effectiveDate) : null,
          chunksCount: chunkCount,
          vectorsCount: chunkCount,
          uploadedAt: metadata.uploadedAt ? new Date(metadata.uploadedAt) : new Date(),
          uploadedBy: metadata.uploadedBy || 'system',
          vectorIds: vectorIds
        };

        if (existing) {
          // Update existing record
          await prisma.legalDocument.update({
            where: { id: docId },
            data: {
              ...documentData,
              updatedAt: new Date()
            }
          });
          updated++;
          console.log(`✅ Updated: ${documentData.title} (${chunkCount} chunks)`);
        } else {
          // Create new record
          await prisma.legalDocument.create({
            data: {
              id: docId,
              ...documentData
            }
          });
          created++;
          console.log(`✨ Created: ${documentData.title} (${chunkCount} chunks)`);
        }
      } catch (error: any) {
        console.error(`❌ Error syncing ${metadata.title || docId}:`, error.message);
        skipped++;
      }
    }

    console.log('\n✅ Sync Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Created: ${created} documents`);
    console.log(`   Updated: ${updated} documents`);
    console.log(`   Skipped: ${skipped} documents`);
    console.log(`   Total Vectors: ${queryResponse.matches.length}`);

    // Verify sync
    const finalCount = await prisma.legalDocument.count();
    console.log(`\n💾 Final DB Count: ${finalCount} documents`);

  } catch (error: any) {
    console.error('❌ Sync failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  syncMetadataFromPinecone()
    .then(() => {
      console.log('\n🎉 Metadata sync completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Metadata sync failed:', error);
      process.exit(1);
    });
}

export { syncMetadataFromPinecone };
