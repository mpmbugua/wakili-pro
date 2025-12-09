import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { logger } from '../utils/logger';
import { articleValidationService } from './ai/articleValidationService';
import { nanoid } from 'nanoid';

const prisma = new PrismaClient();

interface ScrapedArticle {
  title: string;
  sourceUrl: string;
  publishedDate?: string;
  source: 'Kenya Law' | 'Judiciary' | 'LSK';
}

/**
 * Get or create system user for AI-published articles
 */
async function getSystemUser() {
  const systemEmail = 'system@wakili.pro';
  
  let systemUser = await prisma.user.findUnique({
    where: { email: systemEmail }
  });

  if (!systemUser) {
    systemUser = await prisma.user.create({
      data: {
        id: nanoid(),
        email: systemEmail,
        firstName: 'Wakili',
        lastName: 'AI System',
        role: 'ADMIN',
        isVerified: true
      }
    });
    logger.info('Created system user for AI-published articles');
  }

  return systemUser;
}

/**
 * Process and save scraped article with AI validation
 */
async function processScrapedArticle(article: ScrapedArticle): Promise<void> {
  try {
    // Check if article already exists
    const existing = await prisma.article.findFirst({
      where: { fileName: article.sourceUrl }
    });

    if (existing) {
      logger.info(`Article already exists: ${article.title}`);
      return;
    }

    // Validate with AI
    logger.info(`Validating article: ${article.title}`);
    const validation = await articleValidationService.validateArticle(article);

    if (validation.decision === 'reject') {
      logger.info(`Article rejected: ${article.title} - ${validation.reasoning}`);
      return;
    }

    // Get system user
    const systemUser = await getSystemUser();

    // Create article in database
    const newArticle = await prisma.article.create({
      data: {
        id: nanoid(),
        authorId: systemUser.id,
        title: article.title,
        content: validation.extractedContent,
        fileName: article.sourceUrl, // Store source URL in fileName field
        isPremium: false, // AI-scraped articles are always free
        isPublished: validation.decision === 'auto_publish',
        // Store validation metadata in content as JSON prefix
        // This is a workaround since we don't have dedicated fields
        // Format: <!--METADATA:{json}-->content
      }
    });

    // Update article content with metadata
    const metadata = {
      aiSummary: validation.aiSummary,
      category: validation.category,
      tags: validation.tags,
      qualityScore: validation.overallScore,
      source: article.source,
      publishedDate: article.publishedDate,
      validationReasoning: validation.reasoning
    };

    await prisma.article.update({
      where: { id: newArticle.id },
      data: {
        content: `<!--METADATA:${JSON.stringify(metadata)}-->\n\n${validation.extractedContent}`
      }
    });

    logger.info(`Article ${validation.decision === 'auto_publish' ? 'published' : 'queued for review'}: ${article.title} (score: ${validation.overallScore})`);

  } catch (error) {
    logger.error(`Failed to process article "${article.title}":`, error);
  }
}

// Kenya Law Scraper
export async function scrapeKenyanLawReview() {
  try {
    logger.info('Starting Kenya Law scraping...');
    const url = 'https://www.kenyalaw.org/kl/index.php?id=453';
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const articles: ScrapedArticle[] = [];

    // Customize selectors based on actual website structure
    $('article, .article-item, .publication-item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, .title, a').first().text().trim();
      const link = $el.find('a').first().attr('href');
      const date = $el.find('.date, time').first().text().trim();

      if (title && link && title.length > 20) {
        const fullUrl = link.startsWith('http') ? link : `https://www.kenyalaw.org${link}`;
        articles.push({
          title,
          sourceUrl: fullUrl,
          publishedDate: date || undefined,
          source: 'Kenya Law'
        });
      }
    });

    logger.info(`Scraped ${articles.length} articles from Kenya Law`);

    // Process each article with AI validation
    for (const article of articles.slice(0, 10)) { // Limit to 10 per run
      await processScrapedArticle(article);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
    }

    return articles;

  } catch (error) {
    logger.error('Kenya Law scraping error:', error);
    return [];
  }
}
// Judiciary of Kenya Scraper
export async function scrapeJudiciaryOfKenya() {
  try {
    logger.info('Starting Judiciary of Kenya scraping...');
    const url = 'https://www.judiciary.go.ke/resources/judgments/';
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const articles: ScrapedArticle[] = [];

    // Customize selectors for Judiciary website
    $('article, .judgment-item, .resource-item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, .title, a').first().text().trim();
      const link = $el.find('a').first().attr('href');
      const date = $el.find('.date, time').first().text().trim();

      if (title && link && title.length > 20) {
        const fullUrl = link.startsWith('http') ? link : `https://www.judiciary.go.ke${link}`;
        articles.push({
          title,
          sourceUrl: fullUrl,
          publishedDate: date || undefined,
          source: 'Judiciary'
        });
      }
    });

    logger.info(`Scraped ${articles.length} articles from Judiciary of Kenya`);

    // Process each article with AI validation
    for (const article of articles.slice(0, 10)) { // Limit to 10 per run
      await processScrapedArticle(article);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
    }

    return articles;

  } catch (error) {
    logger.error('Judiciary scraping error:', error);
    return [];
  }
}

// Judiciary Events Scraper
export async function scrapeJudiciaryEvents() {
  try {
    logger.info('Starting Judiciary events scraping...');
    const url = 'https://www.judiciary.go.ke/events/';
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const events: Array<{ title: string; eventDate: string; eventType?: string; sourceUrl: string }> = [];

    $('.event-listing, .event-item, article').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.event-title, h2, h3').first().text().trim();
      const eventDate = $el.find('.event-date, .date, time').first().text().trim();
      const href = $el.find('a').first().attr('href');
      
      if (title && eventDate && href) {
        const fullUrl = href.startsWith('http') ? href : `https://www.judiciary.go.ke${href}`;
        events.push({ 
          title, 
          eventDate, 
          eventType: 'Judiciary Event', 
          sourceUrl: fullUrl 
        });
      }
    });

    // Save events to database (if LegalEvent model exists)
    for (const event of events) {
      if (event.title && event.eventDate && event.sourceUrl) {
        try {
          const existing = await prisma.legalEvent.findFirst({ 
            where: { sourceUrl: event.sourceUrl } 
          });
          
          if (existing) {
            await prisma.legalEvent.update({
              where: { id: existing.id },
              data: { 
                title: event.title, 
                eventDate: new Date(event.eventDate), 
                eventType: event.eventType, 
                sourceUrl: event.sourceUrl 
              }
            });
          } else {
            await prisma.legalEvent.create({
              data: { 
                title: event.title, 
                eventDate: new Date(event.eventDate), 
                eventType: event.eventType,
                source: 'Kenya Law Website',
                sourceUrl: event.sourceUrl 
              }
            });
          }
        } catch (error) {
          // LegalEvent model might not exist, skip
          logger.warn('Could not save event (LegalEvent model may not exist):', event.title);
        }
      }
    }

    logger.info(`Scraped ${events.length} events from Judiciary`);
    return events;

  } catch (error) {
    logger.error('Judiciary events scraping error:', error);
    return [];
  }
}

// Law Society of Kenya Scraper
export async function scrapeLawSocietyOfKenya() {
  try {
    logger.info('Starting Law Society of Kenya scraping...');
    const url = 'https://lsk.or.ke/resources/';
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const articles: ScrapedArticle[] = [];

    // Customize selectors for LSK website
    $('article, .resource-item, .post').each((_, el) => {
      const $el = $(el);
      const title = $el.find('h2, h3, .title, a').first().text().trim();
      const link = $el.find('a').first().attr('href');
      const date = $el.find('.date, time, .published').first().text().trim();

      if (title && link && title.length > 20) {
        const fullUrl = link.startsWith('http') ? link : `https://lsk.or.ke${link}`;
        articles.push({
          title,
          sourceUrl: fullUrl,
          publishedDate: date || undefined,
          source: 'LSK'
        });
      }
    });

    logger.info(`Scraped ${articles.length} articles from Law Society of Kenya`);

    // Process each article with AI validation
    for (const article of articles.slice(0, 10)) { // Limit to 10 per run
      await processScrapedArticle(article);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting
    }

    return articles;

  } catch (error) {
    logger.error('LSK scraping error:', error);
    return [];
  }
}

// LSK Events Scraper
export async function scrapeLawSocietyEvents() {
  try {
    logger.info('Starting LSK events scraping...');
    const url = 'https://lsk.or.ke/events/';
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const events: Array<{ title: string; eventDate: string; eventType?: string; sourceUrl: string }> = [];

    $('.event-listing, .event-item, article').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.event-title, h2, h3').first().text().trim();
      const eventDate = $el.find('.event-date, .date, time').first().text().trim();
      const href = $el.find('a').first().attr('href');
      
      if (title && eventDate && href) {
        const fullUrl = href.startsWith('http') ? href : `https://lsk.or.ke${href}`;
        events.push({ 
          title, 
          eventDate, 
          eventType: 'LSK Event', 
          sourceUrl: fullUrl 
        });
      }
    });

    // Save events to database
    for (const event of events) {
      if (event.title && event.eventDate && event.sourceUrl) {
        try {
          const existing = await prisma.legalEvent.findFirst({ 
            where: { sourceUrl: event.sourceUrl } 
          });
          
          if (existing) {
            await prisma.legalEvent.update({
              where: { id: existing.id },
              data: { 
                title: event.title, 
                eventDate: new Date(event.eventDate), 
                eventType: event.eventType, 
                sourceUrl: event.sourceUrl 
              }
            });
          } else {
            await prisma.legalEvent.create({
              data: { 
                title: event.title, 
                eventDate: new Date(event.eventDate), 
                eventType: event.eventType,
                source: 'Judiciary Website',
                sourceUrl: event.sourceUrl 
              }
            });
          }
        } catch (error) {
          logger.warn('Could not save event (LegalEvent model may not exist):', event.title);
        }
      }
    }

    logger.info(`Scraped ${events.length} events from LSK`);
    return events;

  } catch (error) {
    logger.error('LSK events scraping error:', error);
    return [];
  }
}

// Kenya Law Review Events Scraper
export async function scrapeKenyanLawReviewEvents() {
  try {
    logger.info('Starting Kenya Law Review events scraping...');
    const url = 'https://www.kenyalaw.org/kl/index.php?id=453';
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const events: Array<{ title: string; eventDate?: string; eventType?: string; sourceUrl: string }> = [];

    $('.event-listing, .news-listing, .event-item').each((_, el) => {
      const $el = $(el);
      const title = $el.find('.event-title, .news-title, h2, h3').first().text().trim();
      const eventDate = $el.find('.event-date, .news-date, .date').first().text().trim();
      const href = $el.find('a').first().attr('href');
      
      if (title && href) {
        const fullUrl = href.startsWith('http') ? href : `https://www.kenyalaw.org${href}`;
        events.push({ 
          title, 
          eventDate: eventDate || undefined, 
          eventType: 'Law Review Event', 
          sourceUrl: fullUrl 
        });
      }
    });

    // Save events to database
    for (const event of events) {
      if (event.title && event.sourceUrl) {
        try {
          const existing = await prisma.legalEvent.findFirst({ 
            where: { sourceUrl: event.sourceUrl } 
          });
          
          const eventDateObj = event.eventDate ? new Date(event.eventDate) : new Date();
          
          if (existing) {
            await prisma.legalEvent.update({
              where: { id: existing.id },
              data: { 
                title: event.title, 
                eventDate: eventDateObj, 
                eventType: event.eventType, 
                sourceUrl: event.sourceUrl 
              }
            });
          } else {
            await prisma.legalEvent.create({
              data: { 
                title: event.title, 
                eventDate: eventDateObj, 
                eventType: event.eventType,
                source: 'Parliament Website',
                sourceUrl: event.sourceUrl 
              }
            });
          }
        } catch (error) {
          logger.warn('Could not save event (LegalEvent model may not exist):', event.title);
        }
      }
    }

    logger.info(`Scraped ${events.length} events from Kenya Law Review`);
    return events;

  } catch (error) {
    logger.error('Kenya Law Review events scraping error:', error);
    return [];
  }
}

/**
 * Scrape Kenya Law for actual legal documents (Acts, Bills, Case Law)
 * and ingest into AI knowledge base (Pinecone)
 */
export async function scrapeKenyaLawDocuments() {
  try {
    logger.info('Starting Kenya Law legal documents scraping for AI knowledge base...');
    
    const categories = [
      { url: 'https://new.kenyalaw.org/judgments/', type: 'CASE_LAW', category: 'Court Judgments' },
      { url: 'https://new.kenyalaw.org/akn/ke/act/', type: 'LEGISLATION', category: 'Acts of Parliament' },
      { url: 'https://judiciary.go.ke/judgments/', type: 'CASE_LAW', category: 'Judiciary Judgments' },
      { url: 'https://judiciary.go.ke/judgements/', type: 'CASE_LAW', category: 'Judiciary Judgements' }, // Alternative spelling
      { url: 'https://judiciary.go.ke/legal-resources/', type: 'LEGAL_GUIDE', category: 'Legal Resources' }
    ];

    const scrapedDocuments: Array<{ title: string; url: string; type: string; category: string }> = [];
    let ingestedCount = 0;

    for (const cat of categories) {
      try {
        const response = await axios.get(cat.url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        const $ = cheerio.load(response.data);

        // Target Kenya Law judgment page structure
        // Look for PDF links and document titles
        $('a[href*=".pdf"]').each((_, el) => {
          const $el = $(el);
          let title = $el.text().trim();
          const href = $el.attr('href');

          // If link text is empty, try to find title in parent or nearby elements
          if (!title || title.length < 10) {
            title = $el.closest('tr').find('td').first().text().trim() || 
                    $el.closest('div').find('h3, h4, .title, .judgment-title').first().text().trim() ||
                    $el.attr('title') || 
                    '';
          }

          if (title && href && title.length > 10) {
            const fullUrl = href.startsWith('http') ? href : `https://new.kenyalaw.org${href}`;
            
            scrapedDocuments.push({
              title: title.substring(0, 200), // Limit title length
              url: fullUrl,
              type: cat.type,
              category: cat.category
            });
          }
        });

        // Also look for download buttons/links
        $('a[href*="download"], a[download], .download-link, .btn-download').each((_, el) => {
          const $el = $(el);
          const href = $el.attr('href');
          
          if (href && href.includes('.pdf')) {
            const title = $el.text().trim() || 
                         $el.closest('tr').find('td').first().text().trim() ||
                         $el.attr('aria-label') || 
                         'Untitled Document';
            
            if (title.length > 10) {
              const fullUrl = href.startsWith('http') ? href : `https://new.kenyalaw.org${href}`;
              
              // Avoid duplicates
              if (!scrapedDocuments.find(d => d.url === fullUrl)) {
                scrapedDocuments.push({
                  title: title.substring(0, 200),
                  url: fullUrl,
                  type: cat.type,
                  category: cat.category
                });
              }
            }
          }
        });

        logger.info(`Found ${scrapedDocuments.length} documents from ${cat.url}`);

        // Rate limiting between categories
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Failed to scrape category ${cat.category}:`, error);
      }
    }

    logger.info(`Scraped ${scrapedDocuments.length} legal documents from Kenya Law`);

    // Import document ingestion service
    const { documentIngestionService } = await import('./ai/documentIngestionService');
    const systemUser = await getSystemUser();

    // Download and ingest PDFs (configurable limit)
    const BATCH_SIZE = parseInt(process.env.SCRAPER_BATCH_SIZE || '50'); // Process 50 per run
    for (const doc of scrapedDocuments.slice(0, BATCH_SIZE)) {
      try {
        // Check if already exists
        const existing = await prisma.legalDocument.findFirst({
          where: { sourceUrl: doc.url }
        });

        if (existing) {
          logger.info(`Document already indexed: ${doc.title}`);
          continue;
        }

        // Download PDF
        logger.info(`Downloading: ${doc.title}`);
        const pdfResponse = await axios.get(doc.url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        // Save to temp file
        const fs = await import('fs/promises');
        const path = await import('path');
        const tempDir = path.join(process.cwd(), 'storage', 'legal-materials');
        await fs.mkdir(tempDir, { recursive: true });
        
        const fileName = `scraped-${Date.now()}-${doc.title.replace(/[^a-z0-9]/gi, '-').substring(0, 50)}.pdf`;
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, Buffer.from(pdfResponse.data));

        // Ingest into knowledge base
        logger.info(`Ingesting: ${doc.title}`);
        const ingestionResult = await documentIngestionService.ingestDocumentFile(
          filePath,
          'pdf',
          {
            title: doc.title,
            documentType: doc.type,
            category: doc.category,
            sourceUrl: doc.url,
            uploadedBy: systemUser.id
          } as any
        );

        // Save metadata to database
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
            vectorsCount: ingestionResult.chunksProcessed,
            uploadedBy: systemUser.id
          }
        });

        ingestedCount++;
        logger.info(`Successfully ingested: ${doc.title} (${ingestionResult.chunksProcessed} chunks)`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        logger.error(`Failed to ingest document "${doc.title}":`, error);
      }
    }

    return {
      scraped: scrapedDocuments.length,
      ingested: ingestedCount,
      documents: scrapedDocuments
    };

  } catch (error) {
    logger.error('Kenya Law documents scraping error:', error);
    throw error;
  }
}

/**
 * Scrape Judiciary of Kenya website for legal documents
 * Specialized scraper for judiciary.go.ke structure
 */
export async function scrapeJudiciaryDocuments() {
  try {
    logger.info('Starting Judiciary of Kenya documents scraping for AI knowledge base...');
    
    const judiciaryUrls = [
      'https://judiciary.go.ke/judgments/',
      'https://judiciary.go.ke/judgements/',
      'https://judiciary.go.ke/court-of-appeal/',
      'https://judiciary.go.ke/supreme-court/',
      'https://judiciary.go.ke/high-court/'
    ];

    const scrapedDocuments: Array<{ title: string; url: string; type: string; category: string }> = [];
    let ingestedCount = 0;

    for (const url of judiciaryUrls) {
      try {
        logger.info(`Scraping: ${url}`);
        const response = await axios.get(url, {
          timeout: 15000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
          }
        });

        const $ = cheerio.load(response.data);

        // Judiciary-specific selectors
        // Look for PDF links in various formats
        $('a[href*=".pdf"], a[href*="/wp-content/uploads/"], a.pdf-link, .download-link').each((_, el) => {
          const $el = $(el);
          let title = $el.text().trim();
          const href = $el.attr('href');

          // Extract title from various sources
          if (!title || title.length < 10) {
            title = $el.attr('title') || 
                    $el.closest('tr').find('td').first().text().trim() ||
                    $el.closest('div').find('h1, h2, h3, h4, .entry-title, .post-title').first().text().trim() ||
                    $el.closest('article').find('h1, h2, h3').first().text().trim() ||
                    '';
          }

          // Clean up title
          title = title.replace(/download|view|pdf|click here/gi, '').trim();

          if (title && href && title.length > 10) {
            const fullUrl = href.startsWith('http') ? href : `https://judiciary.go.ke${href}`;
            
            // Only include if it's actually a PDF
            if (fullUrl.toLowerCase().includes('.pdf') || fullUrl.includes('/wp-content/uploads/')) {
              scrapedDocuments.push({
                title: title.substring(0, 200),
                url: fullUrl,
                type: 'CASE_LAW',
                category: 'Judiciary of Kenya'
              });
            }
          }
        });

        // Also check for WordPress attachment links
        $('a[href*="/wp-content/uploads/"][href*=".pdf"]').each((_, el) => {
          const $el = $(el);
          const href = $el.attr('href');
          let title = $el.text().trim() || $el.attr('aria-label') || 'Judiciary Document';

          if (href) {
            const fullUrl = href.startsWith('http') ? href : `https://judiciary.go.ke${href}`;
            
            if (!scrapedDocuments.find(d => d.url === fullUrl)) {
              scrapedDocuments.push({
                title: title.substring(0, 200),
                url: fullUrl,
                type: 'CASE_LAW',
                category: 'Judiciary of Kenya'
              });
            }
          }
        });

        logger.info(`Found ${scrapedDocuments.length} documents from ${url}`);
        
        // Rate limiting between URLs
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        logger.error(`Failed to scrape ${url}:`, error);
      }
    }

    logger.info(`Total scraped ${scrapedDocuments.length} documents from Judiciary of Kenya`);

    // Import services
    const { documentIngestionService } = await import('./ai/documentIngestionService');
    const systemUser = await getSystemUser();

    // Process documents (limit per batch)
    const BATCH_SIZE = parseInt(process.env.SCRAPER_BATCH_SIZE || '50');
    for (const doc of scrapedDocuments.slice(0, BATCH_SIZE)) {
      try {
        // Check if already exists
        const existing = await prisma.legalDocument.findFirst({
          where: { sourceUrl: doc.url }
        });

        if (existing) {
          logger.info(`Document already indexed: ${doc.title}`);
          continue;
        }

        // Download PDF
        logger.info(`Downloading: ${doc.title}`);
        const pdfResponse = await axios.get(doc.url, {
          responseType: 'arraybuffer',
          timeout: 30000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });

        // Save to file
        const fs = await import('fs/promises');
        const path = await import('path');
        const tempDir = path.join(process.cwd(), 'storage', 'legal-materials');
        await fs.mkdir(tempDir, { recursive: true });
        
        const fileName = `judiciary-${Date.now()}-${doc.title.replace(/[^a-z0-9]/gi, '-').substring(0, 50)}.pdf`;
        const filePath = path.join(tempDir, fileName);
        await fs.writeFile(filePath, Buffer.from(pdfResponse.data));

        // Ingest into knowledge base
        logger.info(`Ingesting: ${doc.title}`);
        const ingestionResult = await documentIngestionService.ingestDocumentFile(
          filePath,
          'pdf',
          {
            title: doc.title,
            documentType: doc.type,
            category: doc.category,
            sourceUrl: doc.url,
            uploadedBy: systemUser.id
          } as any
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
            fileSize: pdfResponse.data.byteLength,
            chunksCount: ingestionResult.chunksProcessed,
            vectorsCount: ingestionResult.chunksProcessed,
            uploadedBy: systemUser.id
          }
        });

        ingestedCount++;
        logger.info(`Successfully ingested: ${doc.title} (${ingestionResult.chunksProcessed} chunks)`);

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (error) {
        logger.error(`Failed to ingest document "${doc.title}":`, error);
      }
    }

    return {
      scraped: scrapedDocuments.length,
      ingested: ingestedCount,
      documents: scrapedDocuments
    };

  } catch (error) {
    logger.error('Judiciary documents scraping error:', error);
    throw error;
  }
}
