import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import { documentIngestionService } from './ai/documentIngestionService';

interface CrawlConfig {
  seedUrls: string[];
  maxDepth: number;
  maxDocumentsPerRun: number;
  allowedDomains: string[];
  respectRobotsTxt: boolean;
}

interface DiscoveredDocument {
  url: string;
  title: string;
  sourceUrl: string;
  type: 'LEGISLATION' | 'CASE_LAW' | 'STATUTORY_INSTRUMENT' | 'LEGAL_GUIDE';
  category: string;
  depth: number;
}

/**
 * Intelligent Legal Document Crawler
 * Discovers and ingests legal documents by following links
 */
export class IntelligentLegalCrawler {
  private visited: Set<string> = new Set();
  private discoveredDocuments: DiscoveredDocument[] = [];
  private config: CrawlConfig;

  constructor(config?: Partial<CrawlConfig>) {
    this.config = {
      seedUrls: [
        'https://new.kenyalaw.org/judgments/',
        'https://judiciary.go.ke/judgments/',
        'https://judiciary.go.ke/supreme-court/',
        'https://judiciary.go.ke/court-of-appeal/',
        'https://judiciary.go.ke/high-court/',
        'http://www.parliament.go.ke/the-national-assembly/house-business/bills',
        'http://www.parliament.go.ke/the-senate/house-business/bills',
        'https://lsk.or.ke/resources/',
        ...(config?.seedUrls || [])
      ],
      maxDepth: 3, // Follow links up to 3 levels deep
      maxDocumentsPerRun: parseInt(process.env.SCRAPER_BATCH_SIZE || '5'), // Reduced to 5 for faster initial results
      allowedDomains: [
        'kenyalaw.org',
        'judiciary.go.ke',
        'parliament.go.ke',
        'lsk.or.ke',
        'kenyalaw.go.ke'
      ],
      respectRobotsTxt: true,
      ...config
    };
  }

  /**
   * Check if URL is allowed based on domain whitelist
   */
  private isAllowedDomain(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return this.config.allowedDomains.some(domain => 
        urlObj.hostname.includes(domain)
      );
    } catch {
      return false;
    }
  }

  /**
   * Check if URL points to a legal document (PDF)
   */
  private isLegalDocument(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.pdf') || 
           lowerUrl.includes('.pdf?') ||
           lowerUrl.includes('/wp-content/uploads/') && lowerUrl.includes('.pdf');
  }

  /**
   * Determine document type based on URL and content
   */
  private categorizeDocument(url: string, pageUrl: string): { type: DiscoveredDocument['type'], category: string } {
    const lowerUrl = url.toLowerCase();
    const lowerPage = pageUrl.toLowerCase();

    // Supreme Court
    if (lowerPage.includes('supreme-court') || lowerUrl.includes('supreme')) {
      return { type: 'CASE_LAW', category: 'Supreme Court' };
    }
    
    // Court of Appeal
    if (lowerPage.includes('court-of-appeal') || lowerPage.includes('appeal')) {
      return { type: 'CASE_LAW', category: 'Court of Appeal' };
    }

    // High Court
    if (lowerPage.includes('high-court')) {
      return { type: 'CASE_LAW', category: 'High Court' };
    }

    // Parliament Bills/Acts
    if (lowerPage.includes('parliament') || lowerPage.includes('bill')) {
      return { type: 'LEGISLATION', category: 'Parliamentary Bills' };
    }

    // Acts
    if (lowerUrl.includes('/act/') || lowerPage.includes('/act/')) {
      return { type: 'LEGISLATION', category: 'Acts of Parliament' };
    }

    // LSK Resources
    if (lowerPage.includes('lsk.or.ke')) {
      return { type: 'LEGAL_GUIDE', category: 'Law Society Resources' };
    }

    // Default to judgments
    return { type: 'CASE_LAW', category: 'Court Judgments' };
  }

  /**
   * Extract title from link or surrounding context
   */
  private extractTitle($: cheerio.CheerioAPI, $link: cheerio.Cheerio<cheerio.Element>): string {
    // Try multiple sources for title
    let title = $link.text().trim();

    if (!title || title.length < 10) {
      title = $link.attr('title') ||
              $link.attr('aria-label') ||
              $link.closest('tr').find('td').first().text().trim() ||
              $link.closest('div').find('h1, h2, h3, h4, .title').first().text().trim() ||
              $link.closest('article').find('h1, h2, h3').first().text().trim() ||
              $link.parent().text().trim() ||
              '';
    }

    // Clean up title
    title = title.replace(/download|view|pdf|click here|read more/gi, '').trim();
    
    return title.substring(0, 200) || 'Untitled Legal Document';
  }

  /**
   * Crawl a single page and discover documents/links
   */
  private async crawlPage(url: string, depth: number): Promise<void> {
    if (this.visited.has(url) || depth > this.config.maxDepth) {
      return;
    }

    if (!this.isAllowedDomain(url)) {
      return;
    }

    this.visited.add(url);
    logger.info(`[Crawler] Crawling: ${url} (depth: ${depth})`);

    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'WakiliPro Legal Crawler/1.0 (educational purpose)',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);

      // Find all links on the page
      const links: string[] = [];
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        try {
          const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
          
          // Check if it's a PDF document
          if (this.isLegalDocument(fullUrl)) {
            const title = this.extractTitle($, $(el));
            const { type, category } = this.categorizeDocument(fullUrl, url);

            this.discoveredDocuments.push({
              url: fullUrl,
              title,
              sourceUrl: url,
              type,
              category,
              depth
            });

            logger.info(`[Crawler] Found document: ${title}`);
          } 
          // Or a page to crawl further
          else if (this.isAllowedDomain(fullUrl) && !this.visited.has(fullUrl)) {
            // Only follow links that look legal-related
            const linkText = $(el).text().toLowerCase();
            const isLegalLink = 
              fullUrl.includes('judgment') ||
              fullUrl.includes('act') ||
              fullUrl.includes('bill') ||
              fullUrl.includes('legal') ||
              fullUrl.includes('court') ||
              fullUrl.includes('resource') ||
              linkText.includes('judgment') ||
              linkText.includes('case') ||
              linkText.includes('act') ||
              linkText.includes('bill');

            if (isLegalLink) {
              links.push(fullUrl);
            }
          }
        } catch (error) {
          // Invalid URL, skip
        }
      });

      // Recursively crawl discovered pages (rate limited)
      for (const link of links.slice(0, 10)) { // Limit to 10 links per page
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
        await this.crawlPage(link, depth + 1);
      }

    } catch (error) {
      logger.error(`[Crawler] Error crawling ${url}:`, error);
    }
  }

  /**
   * Start crawling from seed URLs
   */
  async crawl(): Promise<{ discovered: number; ingested: number }> {
    logger.info('[Crawler] Starting intelligent legal document crawl...');
    logger.info(`[Crawler] Seed URLs: ${this.config.seedUrls.length}`);
    logger.info(`[Crawler] Max depth: ${this.config.maxDepth}`);
    logger.info(`[Crawler] Max documents: ${this.config.maxDocumentsPerRun}`);

    this.visited.clear();
    this.discoveredDocuments = [];

    // Crawl all seed URLs
    for (const seedUrl of this.config.seedUrls) {
      await this.crawlPage(seedUrl, 0);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between seeds
    }

    logger.info(`[Crawler] Discovery complete. Found ${this.discoveredDocuments.length} documents`);

    // Ingest discovered documents
    const ingestedCount = await this.ingestDocuments();

    return {
      discovered: this.discoveredDocuments.length,
      ingested: ingestedCount
    };
  }

  /**
   * Ingest discovered documents into knowledge base
   */
  private async ingestDocuments(): Promise<number> {
    let ingestedCount = 0;

    // Get or create system user
    const systemEmail = 'system@wakili.pro';
    let systemUser = await prisma.user.findUnique({ where: { email: systemEmail } });

    if (!systemUser) {
      const { nanoid } = await import('nanoid');
      systemUser = await prisma.user.create({
        data: {
          id: nanoid(),
          email: systemEmail,
          firstName: 'Wakili',
          lastName: 'AI Crawler',
          role: 'ADMIN',
          emailVerified: true,
          password: '' // System user, no login
        }
      });
    }

    // Process documents (limit per batch)
    const documentsToProcess = this.discoveredDocuments.slice(0, this.config.maxDocumentsPerRun);

    for (const doc of documentsToProcess) {
      try {
        // Check if already exists
        const existing = await prisma.legalDocument.findFirst({
          where: { sourceUrl: doc.url }
        });

        if (existing) {
          logger.info(`[Crawler] Document already indexed: ${doc.title}`);
          continue;
        }

        // Download PDF
        logger.info(`[Crawler] Downloading: ${doc.title}`);
        const pdfResponse = await axios.get(doc.url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'WakiliPro Legal Crawler/1.0'
          }
        });

        // Save to file
        const fs = await import('fs/promises');
        const path = await import('path');
        const tempDir = path.join(process.cwd(), 'storage', 'legal-materials');
        await fs.mkdir(tempDir, { recursive: true });
        
        const fileName = `crawled-${Date.now()}-${doc.title.replace(/[^a-z0-9]/gi, '-').substring(0, 50)}.pdf`;
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, Buffer.from(pdfResponse.data));

        // Ingest into knowledge base
        logger.info(`[Crawler] Ingesting: ${doc.title}`);
        const ingestionResult = await documentIngestionService.ingestDocumentFile(filePath, {
          title: doc.title,
          documentType: doc.type,
          category: doc.category,
          sourceUrl: doc.url,
          uploadedBy: systemUser.id
        });

        // Save metadata
        await prisma.legalDocument.create({
          data: {
            title: doc.title,
            documentType: doc.type,
            category: doc.category,
            sourceUrl: doc.url,
            filePath,
            fileName,
            fileSize: pdfResponse.data.byteLength,
            chunksCount: ingestionResult.chunksProcessed,
            vectorsCount: ingestionResult.vectorsStored,
            uploadedBy: systemUser.id
          }
        });

        ingestedCount++;
        logger.info(`[Crawler] Successfully ingested: ${doc.title} (${ingestionResult.chunksProcessed} chunks)`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        logger.error(`[Crawler] Failed to ingest document "${doc.title}":`, error);
      }
    }

    return ingestedCount;
  }
}

/**
 * Run intelligent crawler (for manual trigger or cron job)
 */
export async function runIntelligentCrawler() {
  const crawler = new IntelligentLegalCrawler();
  return await crawler.crawl();
}
