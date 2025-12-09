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
    // Use listPaginated to get all vector IDs, then fetch their metadata
    console.log('🔍 Listing all vector IDs from Pinecone...');
    
    const allVectorIds: string[] = [];
    
    // Pinecone list pagination - call directly on index
    let paginationToken: string | undefined = undefined;
    let pageCount = 0;
    
    do {
      const listResponse = await index.listPaginated({
        limit: 100,
        paginationToken
      });
      
      const vectorIds = listResponse.vectors?.map(v => v.id) || [];
      allVectorIds.push(...vectorIds);
      paginationToken = listResponse.pagination?.next;
      pageCount++;
      
      console.log(`   Page ${pageCount}: ${vectorIds.length} vectors (Total: ${allVectorIds.length})`);
      
      // Safety break to avoid infinite loops
      if (pageCount > 100) {
        console.warn('   ⚠️  Hit pagination limit of 100 pages');
        break;
      }
    } while (paginationToken);

    console.log(`   Total vector IDs: ${allVectorIds.length}\n`);

    if (allVectorIds.length === 0) {
      console.log('⚠️  No vectors found in Pinecone. Nothing to sync.');
      return;
    }

    // Fetch vectors in batches with metadata
    console.log('📥 Fetching vector metadata in batches...');
    const batchSize = 100;
    const allVectors: any[] = [];

    for (let i = 0; i < allVectorIds.length; i += batchSize) {
      const batch = allVectorIds.slice(i, i + batchSize);
      const fetchResponse = await index.fetch(batch);
      
      if (fetchResponse.records) {
        Object.values(fetchResponse.records).forEach((record: any) => {
          if (record) {
            allVectors.push(record);
          }
        });
      }
      
      console.log(`   Fetched batch ${Math.floor(i / batchSize) + 1}: ${batch.length} vectors`);
    }

    console.log(`   Total vectors with metadata: ${allVectors.length}\n`);

    // Group vectors by documentId
    const documentMap = new Map<string, {
      metadata: PineconeMetadata;
      chunkCount: number;
      vectorIds: string[];
    }>();

    for (const vector of allVectors) {
      const metadata = vector.metadata as PineconeMetadata;
      const docId = metadata.documentId || vector.id.split('-chunk-')[0];

      if (!documentMap.has(docId)) {
        documentMap.set(docId, {
          metadata,
          chunkCount: 0,
          vectorIds: []
        });
      }

      const doc = documentMap.get(docId)!;
      doc.chunkCount++;
      doc.vectorIds.push(vector.id);
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
          filePath: metadata.sourceUrl || '/unknown',
          fileName: metadata.title || 'unknown.pdf',
          fileSize: 0, // Unknown from Pinecone
          chunksCount: chunkCount,
          vectorsCount: chunkCount,
          uploadedAt: metadata.uploadedAt ? new Date(metadata.uploadedAt) : new Date()
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
          // Create new record - need to link to a user
          // Find any admin user to use as uploader
          const adminUser = await prisma.user.findFirst({
            where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } }
          });

          if (!adminUser) {
            console.warn(`⚠️  Skipping ${documentData.title}: No admin user found for uploadedBy relation`);
            skipped++;
            continue;
          }

          await prisma.legalDocument.create({
            data: {
              id: docId,
              ...documentData,
              uploadedBy: adminUser.id
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
    console.log(`   Total Vectors: ${allVectors.length}`);

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
