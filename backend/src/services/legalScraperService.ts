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
