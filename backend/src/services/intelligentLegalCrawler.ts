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
        // Kenya Law Reports - Primary sources
        'https://new.kenyalaw.org/judgments/',
        'https://kenyalaw.org/kl/index.php?id=398', // Case law database
        'https://kenyalaw.org/caselaw/', // Direct caselaw access
        'https://kenyalaw.org/kl/index.php?id=409', // Acts
        'https://kenyalaw.org/kl/index.php?id=6515', // Constitution
        // Judiciary
        'https://judiciary.go.ke/judgments/',
        'https://judiciary.go.ke/supreme-court/',
        'https://judiciary.go.ke/court-of-appeal/',
        'https://judiciary.go.ke/high-court/',
        'https://judiciary.go.ke/environment-and-land-court/',
        'https://judiciary.go.ke/employment-and-labour-relations-court/',
        // Parliament
        'http://www.parliament.go.ke/the-national-assembly/house-business/bills',
        'http://www.parliament.go.ke/the-senate/house-business/bills',
        'http://www.parliament.go.ke/the-national-assembly/house-business/acts',
        // LSK Resources
        'https://lsk.or.ke/resources/',
        ...(config?.seedUrls || [])
      ],
      maxDepth: 3, // Follow links up to 3 levels deep
      maxDocumentsPerRun: parseInt(process.env.SCRAPER_BATCH_SIZE || '20'), // Increased to 20 for better results
      allowedDomains: [
        'kenyalaw.org',
        'judiciary.go.ke',
        'parliament.go.ke',
        'lsk.or.ke',
        'kenyalaw.go.ke',
        'new.kenyalaw.org'
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
   * Check if URL points to a legal document (PDF or DOCX)
   */
  private isLegalDocument(url: string): boolean {
    const lowerUrl = url.toLowerCase();
    return lowerUrl.endsWith('.pdf') || 
           lowerUrl.endsWith('.docx') ||
           lowerUrl.endsWith('.doc') ||
           lowerUrl.includes('.pdf?') ||
           lowerUrl.includes('.docx?') ||
           lowerUrl.includes('.doc?') ||
           lowerUrl.includes('/wp-content/uploads/') && (lowerUrl.includes('.pdf') || lowerUrl.includes('.docx')) ||
           // Kenya Law specific patterns
           lowerUrl.includes('kenyalaw.org/caselaw/') ||
           lowerUrl.includes('kenyalaw.org/kl/fileadmin/') ||
           (lowerUrl.includes('kenyalaw.org') && lowerUrl.match(/\d{4}/)) || // Year patterns
           // Judiciary patterns
           lowerUrl.includes('judiciary.go.ke/download/') ||
           lowerUrl.includes('judiciary.go.ke/wp-content/uploads/');
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
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        maxRedirects: 5
      });

      const $ = cheerio.load(response.data);

      // Find all links on the page
      const links: string[] = [];
      let pdfCount = 0;
      let pageCount = 0;
      
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        try {
          const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
          
          // Check if it's a PDF document
          if (this.isLegalDocument(fullUrl)) {
            pdfCount++;
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

            logger.info(`[Crawler] ✓ Found document #${this.discoveredDocuments.length}: ${title.substring(0, 80)}`);
          } 
          // Or a page to crawl further
          else if (this.isAllowedDomain(fullUrl) && !this.visited.has(fullUrl)) {
            // Only follow links that look legal-related
            const linkText = $(el).text().toLowerCase();
            const parentText = $(el).parent().text().toLowerCase();
            const isLegalLink = 
              // URL patterns
              fullUrl.includes('judgment') ||
              fullUrl.includes('caselaw') ||
              fullUrl.includes('case') ||
              fullUrl.includes('act') ||
              fullUrl.includes('bill') ||
              fullUrl.includes('legal') ||
              fullUrl.includes('court') ||
              fullUrl.includes('resource') ||
              fullUrl.includes('legislation') ||
              fullUrl.includes('statute') ||
              fullUrl.includes('download') ||
              fullUrl.includes('document') ||
              // Kenya Law specific patterns
              fullUrl.includes('kenyalaw.org/kl/fileadmin') ||
              fullUrl.includes('kenyalaw.org/caselaw') ||
              fullUrl.match(/id=\d+/) || // Query parameter patterns
              // Link text patterns
              linkText.includes('judgment') ||
              linkText.includes('case') ||
              linkText.includes('act') ||
              linkText.includes('bill') ||
              linkText.includes('download') ||
              linkText.includes('view') ||
              linkText.includes('read') ||
              parentText.includes('judgment') ||
              parentText.includes('case');

            if (isLegalLink) {
              pageCount++;
              links.push(fullUrl);
            }
          }
        } catch (error) {
          // Invalid URL, skip
        }
      });

      logger.info(`[Crawler] Page summary - PDFs: ${pdfCount}, Pages to crawl: ${pageCount}`);

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

        // Download document
        logger.info(`[Crawler] Downloading: ${doc.title}`);
        const docResponse = await axios.get(doc.url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'
          }
        });

        // Determine file extension
        const urlLower = doc.url.toLowerCase();
        let fileExtension = 'pdf';
        let fileType: 'pdf' | 'docx' = 'pdf';
        
        if (urlLower.endsWith('.docx') || urlLower.includes('.docx?')) {
          fileExtension = 'docx';
          fileType = 'docx';
        } else if (urlLower.endsWith('.doc') || urlLower.includes('.doc?')) {
          fileExtension = 'doc';
          fileType = 'docx'; // Treat .doc as docx for processing
        }

        // Save to file
        const fs = await import('fs/promises');
        const path = await import('path');
        const tempDir = path.join(process.cwd(), 'storage', 'legal-materials');
        await fs.mkdir(tempDir, { recursive: true });
        
        const fileName = `crawled-${Date.now()}-${doc.title.replace(/[^a-z0-9]/gi, '-').substring(0, 50)}.${fileExtension}`;
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, Buffer.from(docResponse.data));

        // Ingest into knowledge base
        logger.info(`[Crawler] Ingesting: ${doc.title} (${fileType})`);
        const ingestionResult = await documentIngestionService.ingestDocumentFile(
          filePath,
          fileType,
          {
            title: doc.title,
            documentType: doc.type,
            category: doc.category,
            sourceUrl: doc.url,
            uploadedBy: systemUser.id
          }
        );

        // Save metadata
        await prisma.legalDocument.create({
          data: {
            title: doc.title,
            documentType: doc.type,
            category: doc.category,
            sourceUrl: doc.url,
            filePath,
            fileName,
            fileSize: docResponse.data.byteLength,
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
