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
        // Kenya Law fileadmin - Direct PDF storage (PROVEN TO WORK)
        'https://kenyalaw.org/kl/fileadmin/pdfdownloads/',
        'https://kenyalaw.org/kl/fileadmin/pdfdownloads/Acts/',
        'https://kenyalaw.org/kl/fileadmin/pdfdownloads/bills/',
        'https://kenyalaw.org/kl/fileadmin/CommissionReports/',
        // Kenya Law case law database
        'https://kenyalaw.org/kl/index.php?id=398', // Case law database
        'https://kenyalaw.org/kl/index.php?id=409', // Acts
        'https://kenyalaw.org/kl/index.php?id=6515', // Constitution
        // Parliament downloads
        'https://www.parliament.go.ke/downloads',
        'https://www.parliament.go.ke/the-national-assembly/house-business/bills',
        'https://www.parliament.go.ke/the-national-assembly/house-business/acts',
        // Try a few Judiciary main pages (avoid 404s)
        'https://judiciary.go.ke/',
        'https://judiciary.go.ke/judgments/',
        ...(config?.seedUrls || [])
      ],
      maxDepth: 5, // Follow links up to 5 levels deep (balance between discovery and speed)
      maxDocumentsPerRun: parseInt(process.env.SCRAPER_BATCH_SIZE || '50'), // Process up to 50 documents per run (to avoid timeout)
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
      const hostname = urlObj.hostname;
      const path = urlObj.pathname + urlObj.search;
      
      // Skip old Kenya Law navigation pages (index.php with just id parameter)
      if (hostname.includes('kenyalaw.org') && !hostname.includes('new.kenyalaw.org')) {
        if (path.includes('index.php?id=') && !path.includes('download') && !path.includes('fileadmin')) {
          return false; // Skip old site navigation pages
        }
      }
      
      return this.config.allowedDomains.some(domain => 
        hostname.includes(domain)
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
    
    // STRICT: Only accept actual file extensions
    const hasFileExtension = 
      lowerUrl.endsWith('.pdf') || 
      lowerUrl.endsWith('.docx') ||
      lowerUrl.endsWith('.doc') ||
      lowerUrl.includes('.pdf?') ||
      lowerUrl.includes('.pdf#') ||
      lowerUrl.includes('.docx?') ||
      lowerUrl.includes('.doc?');
    
    if (!hasFileExtension) {
      return false; // Not a file, just a page
    }
    
    // Additional patterns for file downloads
    const isFileDownload = 
      lowerUrl.includes('/wp-content/uploads/') ||
      lowerUrl.includes('/fileadmin/') ||
      lowerUrl.includes('/download/') ||
      lowerUrl.includes('judiciary.go.ke/download/') ||
      lowerUrl.includes('judiciary.go.ke/wp-content/uploads/');
    
    return hasFileExtension || isFileDownload;
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
   * Check if title/URL is actually a legal document (not navigation/junk)
   */
  private isValidLegalDocument(title: string, url: string): boolean {
    const titleLower = title.toLowerCase();
    const urlLower = url.toLowerCase();

    // Reject navigation/website pages
    const junkKeywords = [
      'site map', 'sitemap', 'contact us', 'contact', 'about us', 'about',
      'careers', 'jobs', 'vacancies', 'product catalogue', 'products',
      'privacy policy', 'terms of service', 'terms and conditions',
      'cookie policy', 'disclaimer', 'home page', 'home', 'homepage',
      'navigation', 'menu', 'footer', 'header', 'search', 'search results',
      'login', 'sign in', 'register', 'sign up', 'subscribe',
      'newsletter', 'rss feed', 'feedback', 'help', 'faq',
      'accessibility', 'press release', 'news', 'blog', 'events',
      'downloads', 'resources', 'links', 'related links',
      'more information', 'click here', 'read more', 'view all',
      'back to top', 'print', 'email', 'share', 'social media'
    ];

    for (const keyword of junkKeywords) {
      if (titleLower.includes(keyword) && titleLower.length < 50) {
        return false; // Short titles matching junk keywords are likely navigation
      }
    }

    // Reject if title is too short (likely navigation link)
    if (title.length < 15) {
      return false;
    }

    // Reject generic filenames that aren't documents
    const genericNames = [
      'untitled', 'document', 'file', 'download', 'attachment',
      'temp', 'test', 'sample', 'example', 'draft'
    ];

    if (genericNames.some(name => titleLower === name || titleLower === name + '.pdf')) {
      return false;
    }

    // Accept if it has legal document indicators
    const legalIndicators = [
      'v.', 'vs.', 'versus', // Case names
      'act', 'bill', 'law', 'statute', 'regulation', // Legislation
      'judgment', 'ruling', 'order', 'decree', // Court documents
      'petition', 'appeal', 'application', 'suit', // Case types
      'constitution', 'amendment', 'ordinance', // Constitutional docs
      '[20', '(20', '19', // Years in citations
      'klr', 'eklr', 'ksc', 'keca', 'kehc', // Kenya Law Reports
      'civil', 'criminal', 'commercial', 'election', // Case categories
      'supreme court', 'court of appeal', 'high court' // Court types
    ];

    const hasLegalIndicator = legalIndicators.some(indicator => 
      titleLower.includes(indicator) || urlLower.includes(indicator)
    );

    if (hasLegalIndicator) {
      return true;
    }

    // If it's a PDF from a legal domain and reasonably long title, probably valid
    if (urlLower.endsWith('.pdf') && title.length >= 20) {
      return true;
    }

    // Default reject if no clear legal indicators
    return false;
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
    logger.info(`[Crawler] 📍 Crawling: ${url} (depth: ${depth})`);

    try {
      const response = await axios.get(url, {
        timeout: 120000, // Increased to 120s for extremely slow government sites
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

      logger.info(`[Crawler] ✓ Page loaded: ${response.status} ${response.statusText} (${response.data.length} bytes)`);

      const $ = cheerio.load(response.data);

      // Count total links on page
      const totalLinks = $('a[href]').length;
      logger.info(`[Crawler] Found ${totalLinks} total links on page`);

      // Find all links on the page
      const links: string[] = [];
      let pdfCount = 0;
      let docxCount = 0;
      let pageCount = 0;
      let skippedCount = 0;
      const sampleUrls: string[] = [];
      
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        try {
          const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
          
          // Log first 5 Kenya Law URLs for debugging
          if (sampleUrls.length < 5 && fullUrl.includes('kenyalaw')) {
            sampleUrls.push(fullUrl);
          }
          
          // Check if it's a PDF document
          if (this.isLegalDocument(fullUrl)) {
            const urlLower = fullUrl.toLowerCase();
            if (urlLower.includes('.pdf')) pdfCount++;
            if (urlLower.includes('.docx') || urlLower.includes('.doc')) docxCount++;
            
            const title = this.extractTitle($, $(el));
            
            // Validate it's actually a legal document (not navigation/junk)
            if (!this.isValidLegalDocument(title, fullUrl)) {
              logger.info(`[Crawler] ⏭️  Skipping junk: "${title.substring(0, 60)}"`);
              skippedCount++;
              return;
            }
            
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
              // Judiciary patterns - MOST AGGRESSIVE
              fullUrl.includes('judiciary.go.ke/download') ||
              fullUrl.includes('judiciary.go.ke/category') ||
              fullUrl.includes('judiciary.go.ke/wp-content') ||
              fullUrl.includes('judiciary.go.ke/judgments') ||
              // Kenya Law fileadmin (actual PDFs)
              fullUrl.includes('kenyalaw.org/kl/fileadmin/') ||
              fullUrl.includes('kenyalaw.org/caselaw/cases/') ||
              // Generic document patterns
              fullUrl.includes('judgment') ||
              fullUrl.includes('download') ||
              fullUrl.includes('document') ||
              fullUrl.includes('/wp-content/') ||
              fullUrl.match(/[?&]id=\d+/) || // Query parameter patterns
              fullUrl.match(/[?&]download=/) ||
              // Link text patterns
              linkText.includes('judgment') ||
              linkText.includes('download') ||
              linkText.includes('pdf') ||
              linkText.includes('view') ||
              linkText.includes('read') ||
              linkText.includes('bill') ||
              linkText.match(/\d{4}/) || // Year in link text
              parentText.includes('judgment') ||
              parentText.includes('case') ||
              parentText.includes('download');

            if (isLegalLink) {
              pageCount++;
              links.push(fullUrl);
            } else {
              skippedCount++;
            }
          }
        } catch (error) {
          // Invalid URL, skip
        }
      });

      logger.info(`[Crawler] 📊 Page summary - PDFs: ${pdfCount}, DOCX: ${docxCount}, Pages to crawl: ${pageCount}, Skipped: ${skippedCount}`);

      // Log sample Kenya Law URLs found
      if (sampleUrls.length > 0) {
        logger.info(`[Crawler] 🔍 Sample Kenya Law URLs found: ${sampleUrls.join(' | ')}`);
      }

      // Log first few links found
      if (links.length > 0) {
        logger.info(`[Crawler] Sample links to follow: ${links.slice(0, 3).join(', ')}`);
      }

      // Recursively crawl discovered pages (rate limited)
      for (const link of links.slice(0, 20)) { // Increased to 20 links per page for Kenya Law
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

    // Crawl all seed URLs (stop early if we have enough)
    for (const seedUrl of this.config.seedUrls) {
      await this.crawlPage(seedUrl, 0);
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay between seeds
      
      // Stop early if we've discovered enough documents
      if (this.discoveredDocuments.length >= this.config.maxDocumentsPerRun * 2) {
        logger.info(`[Crawler] Early stop: Discovered ${this.discoveredDocuments.length} documents (will process ${this.config.maxDocumentsPerRun})`);
        break;
      }
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
   * Made public so it can be called from API routes
   */
  async ingestDocuments(): Promise<number> {
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

        // Download document with retry logic and fallback URL
        logger.info(`[Crawler] Downloading: ${doc.title}`);
        
        let docResponse;
        let retries = 3;
        let urlsToTry = [doc.url];
        if ((doc as any).fallbackUrl) {
          urlsToTry.push((doc as any).fallbackUrl);
        }
        
        let lastError;
        for (const urlToTry of urlsToTry) {
          for (let attempt = 1; attempt <= retries; attempt++) {
            try {
              logger.info(`[Crawler] Trying URL: ${urlToTry} (attempt ${attempt}/${retries})`);
              docResponse = await axios.get(urlToTry, {
                responseType: 'arraybuffer',
                timeout: 120000, // 2 minutes for slow servers
                headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
                  'Accept': 'application/pdf,application/octet-stream,*/*'
                }
              });
              logger.info(`[Crawler] ✅ Successfully downloaded from: ${urlToTry}`);
              break; // Success, exit retry loop
            } catch (downloadError: any) {
              lastError = downloadError;
              if (attempt === retries) {
                logger.warn(`[Crawler] All ${retries} attempts failed for URL: ${urlToTry}`);
                break; // Try next URL
              }
              logger.warn(`[Crawler] Download attempt ${attempt}/${retries} failed for "${doc.title}": ${downloadError.message}. Retrying in ${attempt * 2}s...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Exponential backoff
            }
          }
          
          if (docResponse) break; // Successfully downloaded, no need to try fallback
        }
        
        if (!docResponse) {
          throw lastError || new Error('All download attempts failed');
        }

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
        logger.info(`[Crawler] ✅ Successfully ingested ${ingestedCount}/${documentsToProcess.length}: ${doc.title} (${ingestionResult.chunksProcessed} chunks)`);

        // Rate limiting - reduced for faster ingestion
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error(`[Crawler] ❌ Failed to ingest document "${doc.title}":`, error);
        logger.error(`[Crawler] Error details:`, {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          url: doc.url
        });
      }
    }

    logger.info(`[Crawler] Ingestion summary: ${ingestedCount}/${documentsToProcess.length} documents successfully ingested`);
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
