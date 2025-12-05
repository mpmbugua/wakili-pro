import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { logger } from '../utils/logger';

/**
 * Remove duplicate legal documents (keep the one with vectors)
 * DELETE /api/admin/cleanup/duplicates
 */
export const removeDuplicates = async (req: Request, res: Response) => {
  try {
    logger.info('[Cleanup] Starting duplicate removal...');

    // Find all documents grouped by title
    const allDocuments = await prisma.legalDocument.findMany({
      orderBy: { uploadedAt: 'asc' }
    });

    const documentsByTitle = new Map<string, typeof allDocuments>();
    
    for (const doc of allDocuments) {
      const existing = documentsByTitle.get(doc.title) || [];
      existing.push(doc);
      documentsByTitle.set(doc.title, existing);
    }

    let duplicatesRemoved = 0;
    const deletedIds: string[] = [];

    // For each title with duplicates, keep only the best one
    for (const [title, docs] of documentsByTitle.entries()) {
      if (docs.length > 1) {
        // Sort: prefer documents with vectors > 0, then by upload date (newer first)
        docs.sort((a, b) => {
          if (a.vectorsCount !== b.vectorsCount) {
            return b.vectorsCount - a.vectorsCount; // Higher vectors first
          }
          return b.uploadedAt.getTime() - a.uploadedAt.getTime(); // Newer first
        });

        // Keep the first one (best), delete the rest
        const toKeep = docs[0];
        const toDelete = docs.slice(1);

        logger.info(`[Cleanup] Title "${title}": Keeping ${toKeep.id} (${toKeep.vectorsCount} vectors), deleting ${toDelete.length} duplicates`);

        for (const doc of toDelete) {
          await prisma.legalDocument.delete({ where: { id: doc.id } });
          deletedIds.push(doc.id);
          duplicatesRemoved++;
        }
      }
    }

    logger.info(`[Cleanup] Removed ${duplicatesRemoved} duplicate documents`);

    return res.json({
      success: true,
      message: `Removed ${duplicatesRemoved} duplicate documents`,
      data: {
        duplicatesRemoved,
        deletedIds
      }
    });
  } catch (error: any) {
    logger.error('[Cleanup] Error removing duplicates:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove duplicates',
      error: error.message
    });
  }
};

/**
 * Remove junk/non-legal documents (navigation pages, etc.)
 * DELETE /api/admin/cleanup/junk
 */
export const removeJunkDocuments = async (req: Request, res: Response) => {
  try {
    logger.info('[Cleanup] Starting junk document removal...');

    const junkKeywords = [
      'site map',
      'contact us',
      'careers',
      'product catalogue',
      'about us',
      'privacy policy',
      'terms of service',
      'cookie policy',
      'disclaimer',
      'home page',
      'navigation',
      'menu',
      'footer',
      'header',
      'search',
      'login',
      'register',
      'sitemap'
    ];

    const junkDocuments = await prisma.legalDocument.findMany({
      where: {
        OR: junkKeywords.map(keyword => ({
          title: {
            contains: keyword,
            mode: 'insensitive' as const
          }
        }))
      }
    });

    const deletedIds: string[] = [];

    for (const doc of junkDocuments) {
      logger.info(`[Cleanup] Deleting junk document: "${doc.title}"`);
      await prisma.legalDocument.delete({ where: { id: doc.id } });
      deletedIds.push(doc.id);
    }

    logger.info(`[Cleanup] Removed ${junkDocuments.length} junk documents`);

    return res.json({
      success: true,
      message: `Removed ${junkDocuments.length} junk documents`,
      data: {
        junkRemoved: junkDocuments.length,
        deletedIds
      }
    });
  } catch (error: any) {
    logger.error('[Cleanup] Error removing junk:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove junk documents',
      error: error.message
    });
  }
};

/**
 * Remove documents with 0 vectors (failed ingestion)
 * DELETE /api/admin/cleanup/zero-vectors
 */
export const removeZeroVectorDocuments = async (req: Request, res: Response) => {
  try {
    logger.info('[Cleanup] Starting zero-vector document removal...');

    const zeroVectorDocs = await prisma.legalDocument.findMany({
      where: { vectorsCount: 0 }
    });

    const deletedIds: string[] = [];

    for (const doc of zeroVectorDocs) {
      logger.info(`[Cleanup] Deleting zero-vector document: "${doc.title}"`);
      await prisma.legalDocument.delete({ where: { id: doc.id } });
      deletedIds.push(doc.id);
    }

    logger.info(`[Cleanup] Removed ${zeroVectorDocs.length} zero-vector documents`);

    return res.json({
      success: true,
      message: `Removed ${zeroVectorDocs.length} documents with 0 vectors`,
      data: {
        zeroVectorRemoved: zeroVectorDocs.length,
        deletedIds
      }
    });
  } catch (error: any) {
    logger.error('[Cleanup] Error removing zero-vector documents:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove zero-vector documents',
      error: error.message
    });
  }
};

/**
 * Full cleanup: duplicates + junk + zero vectors
 * DELETE /api/admin/cleanup/all
 */
export const fullCleanup = async (req: Request, res: Response) => {
  try {
    logger.info('[Cleanup] Starting full cleanup...');

    const results = {
      duplicatesRemoved: 0,
      junkRemoved: 0,
      zeroVectorRemoved: 0,
      totalRemoved: 0
    };

    // Step 1: Remove junk
    const junkKeywords = [
      'site map', 'contact us', 'careers', 'product catalogue',
      'about us', 'privacy policy', 'terms of service', 'cookie policy',
      'disclaimer', 'home page', 'navigation', 'menu', 'footer',
      'header', 'search', 'login', 'register', 'sitemap'
    ];

    const junkDocuments = await prisma.legalDocument.findMany({
      where: {
        OR: junkKeywords.map(keyword => ({
          title: { contains: keyword, mode: 'insensitive' as const }
        }))
      }
    });

    for (const doc of junkDocuments) {
      await prisma.legalDocument.delete({ where: { id: doc.id } });
      results.junkRemoved++;
    }

    // Step 2: Remove zero-vector documents
    const zeroVectorDocs = await prisma.legalDocument.findMany({
      where: { vectorsCount: 0 }
    });

    for (const doc of zeroVectorDocs) {
      await prisma.legalDocument.delete({ where: { id: doc.id } });
      results.zeroVectorRemoved++;
    }

    // Step 3: Remove duplicates (keep best one)
    const allDocuments = await prisma.legalDocument.findMany({
      orderBy: { uploadedAt: 'asc' }
    });

    const documentsByTitle = new Map<string, typeof allDocuments>();
    
    for (const doc of allDocuments) {
      const existing = documentsByTitle.get(doc.title) || [];
      existing.push(doc);
      documentsByTitle.set(doc.title, existing);
    }

    for (const [, docs] of documentsByTitle.entries()) {
      if (docs.length > 1) {
        docs.sort((a, b) => {
          if (a.vectorsCount !== b.vectorsCount) {
            return b.vectorsCount - a.vectorsCount;
          }
          return b.uploadedAt.getTime() - a.uploadedAt.getTime();
        });

        const toDelete = docs.slice(1);
        for (const doc of toDelete) {
          await prisma.legalDocument.delete({ where: { id: doc.id } });
          results.duplicatesRemoved++;
        }
      }
    }

    results.totalRemoved = results.duplicatesRemoved + results.junkRemoved + results.zeroVectorRemoved;

    logger.info(`[Cleanup] Full cleanup complete: ${results.totalRemoved} documents removed`);

    return res.json({
      success: true,
      message: `Full cleanup complete: removed ${results.totalRemoved} documents`,
      data: results
    });
  } catch (error: any) {
    logger.error('[Cleanup] Full cleanup error:', error);
    return res.status(500).json({
      success: false,
      message: 'Full cleanup failed',
      error: error.message
    });
  }
};
