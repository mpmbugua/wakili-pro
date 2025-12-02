import express from 'express';
import { authenticateToken, authorizeRoles } from '../../middleware/auth';
import { crawlerScheduler } from '../../services/crawlerScheduler';
import { logger } from '../../utils/logger';

const router = express.Router();

/**
 * GET /api/admin/crawler/status
 * Get crawler scheduler status
 */
router.get('/status', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    const isRunning = crawlerScheduler.isRunning();
    const nextRun = crawlerScheduler.getNextRunTime();

    res.json({
      success: true,
      data: {
        isRunning,
        nextRun: nextRun?.toISOString(),
        nextRunFormatted: nextRun?.toLocaleString('en-KE', { 
          timeZone: 'Africa/Nairobi',
          dateStyle: 'full',
          timeStyle: 'short'
        }),
        schedule: 'Daily at 5:00 PM (East Africa Time)'
      }
    });
  } catch (error) {
    logger.error('[Crawler API] Error fetching status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crawler status',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/crawler/trigger
 * Manually trigger an immediate crawl (runs in background)
 */
router.post('/trigger', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    logger.info(`[Crawler API] Manual crawl triggered by user: ${req.user?.email}`);

    // Run crawler in background (don't wait for completion)
    crawlerScheduler.triggerManualCrawl()
      .then(result => {
        logger.info(`[Crawler API] Background crawl complete: Discovered ${result.discovered}, Ingested ${result.ingested}`);
      })
      .catch(error => {
        logger.error('[Crawler API] Background crawl failed:', error);
      });

    // Respond immediately
    res.json({
      success: true,
      message: 'Crawler started in background. Check logs for progress. Results will appear in 5-10 minutes.',
      data: {
        status: 'running',
        estimatedTime: '5-10 minutes for first results'
      }
    });
  } catch (error) {
    logger.error('[Crawler API] Failed to trigger manual crawl:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger manual crawl',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/crawler/seed-real-pdfs
 * Download and ingest real PDFs from Kenya Law (direct URLs)
 */
router.post('/seed-real-pdfs', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    logger.info(`[Crawler API] Real PDF seeding triggered by user: ${req.user?.email}`);
    
    // Import crawler to use its ingestion logic
    const { IntelligentLegalCrawler } = await import('../../services/intelligentLegalCrawler');
    const crawler = new IntelligentLegalCrawler({ maxDocumentsPerRun: 10 });

    // ⚠️ CRITICAL: Kenya Law Reports restructured their URLs - old /Acts/ subfolder no longer works
    // Using VERIFIED stable URLs from kenyalaw.org/kl/fileadmin/pdfdownloads/ (tested Dec 2025)
    const realPDFs = [
      // Constitution - verified stable URL
      { url: 'https://kenyalaw.org/kl/fileadmin/pdfdownloads/TheConstitutionOfKenya.pdf', title: 'Constitution of Kenya 2010', type: 'LEGISLATION' as const, category: 'Constitutional Law' },
      
      // Cap Acts - using legacy Cap numbering system (more stable)
      { url: 'http://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/LawofSuccessionAct_Cap160.pdf', title: 'Law of Succession Act Cap. 160', type: 'LEGISLATION' as const, category: 'Succession Law' },
      { url: 'http://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/EvidenceAct_Cap80.pdf', title: 'Evidence Act Cap. 80', type: 'LEGISLATION' as const, category: 'Civil Procedure' },
      { url: 'http://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/PenalCode_Cap63.pdf', title: 'Penal Code Cap. 63', type: 'LEGISLATION' as const, category: 'Criminal Law' },
      
      // Recent Acts - using year-based naming (2007-2016)
      { url: 'http://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/Employment_Act_2007.pdf', title: 'Employment Act 2007', type: 'LEGISLATION' as const, category: 'Employment Law' },
      { url: 'http://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/2019/TheDataProtectionAct_No24of2019.pdf', title: 'Data Protection Act 2019', type: 'LEGISLATION' as const, category: 'Privacy Law' },
      
      // 2010-2016 Constitutional Acts
      { url: 'http://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/CountyGovernmentsAct_No17of2012.pdf', title: 'County Governments Act 2012', type: 'LEGISLATION' as const, category: 'Constitutional Law' },
      { url: 'http://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/LandActNo6of2012.pdf', title: 'Land Act 2012', type: 'LEGISLATION' as const, category: 'Property Law' },
      { url: 'http://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/LandRegistrationActNo3of2012.pdf', title: 'Land Registration Act 2012', type: 'LEGISLATION' as const, category: 'Property Law' },
      { url: 'http://kenyalaw.org/kl/fileadmin/pdfdownloads/CompaniesActNo17of2015.pdf', title: 'Companies Act 2015', type: 'LEGISLATION' as const, category: 'Corporate Law' }
    ];

    // Set discovered documents
    (crawler as any).discoveredDocuments = realPDFs.map(doc => ({
      url: doc.url,
      title: doc.title,
      sourceUrl: 'http://kenyalaw.org',
      type: doc.type,
      category: doc.category,
      depth: 0
    }));

    logger.info(`[Crawler API] Set ${realPDFs.length} documents for ingestion`);

    // Ingest them
    logger.info(`[Crawler API] Starting ingestion...`);
    const ingestedCount = await crawler.ingestDocuments();
    logger.info(`[Crawler API] Ingestion complete: ${ingestedCount}/${realPDFs.length}`);

    res.json({
      success: true,
      message: `Successfully ingested ${ingestedCount}/${realPDFs.length} real Kenya Law PDFs`,
      data: {
        discovered: realPDFs.length,
        ingested: ingestedCount
      }
    });
  } catch (error) {
    logger.error('[Crawler API] Failed to seed real PDFs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed real PDFs',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/crawler/seed-sample-data
 * Add sample legal documents for testing (bypasses actual crawling)
 */
router.post('/seed-sample-data', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    logger.info(`[Crawler API] Sample data seeding triggered by user: ${req.user?.email}`);
    
    const { prisma } = await import('../../lib/prisma');
    
    // Sample legal documents
    const sampleDocs = [
      {
        title: 'The Constitution of Kenya, 2010',
        content: 'The Constitution of Kenya is the supreme law of the Republic of Kenya. The current constitution was promulgated on 27 August 2010. It replaced the Independence Constitution of 1963.',
        documentType: 'LEGISLATION',
        category: 'Constitutional Law',
        citation: 'Constitution of Kenya, 2010',
        sourceUrl: 'https://www.constituteproject.org/constitution/Kenya_2010.pdf'
      },
      {
        title: 'Employment Act, 2007',
        content: 'An Act of Parliament to declare and define the fundamental rights of employees, to provide basic conditions of employment of employees, to regulate employment of children, and for connected purposes.',
        documentType: 'LEGISLATION',
        category: 'Employment Law',
        citation: 'Employment Act No. 11 of 2007',
        sourceUrl: 'http://www.parliament.go.ke'
      },
      {
        title: 'The Land Act, 2012',
        content: 'An Act of Parliament to give effect to Article 68 of the Constitution; to revise, consolidate and rationalize land laws; and for connected purposes.',
        documentType: 'LEGISLATION',
        category: 'Land & Property Law',
        citation: 'Land Act No. 6 of 2012',
        sourceUrl: 'http://www.kenyalaw.org'
      },
      {
        title: 'Companies Act, 2015',
        content: 'An Act of Parliament to consolidate the law relating to companies and to promote transparency, accountability and efficiency in the administration and management of companies.',
        documentType: 'LEGISLATION',
        category: 'Corporate Law',
        citation: 'Companies Act No. 17 of 2015',
        sourceUrl: 'http://www.kenyalaw.org'
      },
      {
        title: 'Data Protection Act, 2019',
        content: 'An Act of Parliament to regulate the processing of personal data; to provide for the rights of data subjects and obligations of data controllers and processors.',
        documentType: 'LEGISLATION',
        category: 'Technology & Privacy Law',
        citation: 'Data Protection Act No. 24 of 2019',
        sourceUrl: 'http://www.kenyalaw.org'
      }
    ];

    let createdCount = 0;
    for (const doc of sampleDocs) {
      const existing = await prisma.legalDocument.findFirst({
        where: { title: doc.title }
      });
      
      if (!existing) {
        await prisma.legalDocument.create({
          data: {
            ...doc,
            chunksCount: 10,
            vectorsCount: 10
          }
        });
        createdCount++;
      }
    }

    logger.info(`[Crawler API] Sample data seeded: ${createdCount} new documents`);

    res.json({
      success: true,
      message: `Seeded ${createdCount} sample legal documents`,
      data: {
        created: createdCount,
        total: sampleDocs.length
      }
    });
  } catch (error) {
    logger.error('[Crawler API] Failed to seed sample data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to seed sample data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/crawler/start
 * Start the automated crawler scheduler
 */
router.post('/start', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    crawlerScheduler.start();
    const nextRun = crawlerScheduler.getNextRunTime();

    logger.info(`[Crawler API] Scheduler started by user: ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Crawler scheduler started',
      data: {
        nextRun: nextRun?.toISOString(),
        schedule: 'Daily at 5:00 PM (East Africa Time)'
      }
    });
  } catch (error) {
    logger.error('[Crawler API] Failed to start scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start crawler scheduler',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/admin/crawler/stop
 * Stop the automated crawler scheduler
 */
router.post('/stop', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), (req, res) => {
  try {
    crawlerScheduler.stop();

    logger.info(`[Crawler API] Scheduler stopped by user: ${req.user?.email}`);

    res.json({
      success: true,
      message: 'Crawler scheduler stopped'
    });
  } catch (error) {
    logger.error('[Crawler API] Failed to stop scheduler:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop crawler scheduler',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/admin/crawler/test
 * Test crawler on a single Kenya Law URL to verify it's finding documents
 */
router.get('/test', authenticateToken, authorizeRoles('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  try {
    const { IntelligentLegalCrawler } = await import('../../services/intelligentLegalCrawler');
    
    // Test with a single Kenya Law judgments page
    const testCrawler = new IntelligentLegalCrawler({
      seedUrls: ['https://kenyalaw.org/caselaw/'],
      maxDepth: 2,
      maxDocumentsPerRun: 10
    });

    logger.info('[Crawler Test] Starting test crawl of Kenya Law...');
    const result = await testCrawler.crawl();

    res.json({
      success: true,
      message: `Test crawl complete. Found ${result.discovered} documents.`,
      data: {
        discovered: result.discovered,
        ingested: result.ingested,
        testUrl: 'https://kenyalaw.org/caselaw/',
        note: 'This is a limited test. Full crawl covers 15+ seed URLs.'
      }
    });
  } catch (error) {
    logger.error('[Crawler Test] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Test crawl failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

