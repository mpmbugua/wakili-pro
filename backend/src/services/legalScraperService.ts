import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Judiciary of Kenya Event Scraper
export async function scrapeJudiciaryEvents() {
  const url = 'https://www.judiciary.go.ke/events/'; // Example events page
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const events: Array<{ title: string; eventDate: string; eventType?: string; sourceUrl: string }> = [];
  // Example selector: update for real site structure
  $('.event-listing').each((_, el) => {
    const title = $(el).find('.event-title').text().trim();
    const eventDate = $(el).find('.event-date').text().trim();
    const href = $(el).find('a').attr('href');
    if (title && eventDate && href) {
      events.push({ title, eventDate, sourceUrl: href });
    }
  });
  for (const event of events) {
    if (event.title && event.eventDate && event.sourceUrl) {
      const existing = await prisma.legalEvent.findFirst({ where: { sourceUrl: event.sourceUrl } });
      if (existing) {
        await prisma.legalEvent.update({
          where: { id: existing.id },
          data: { title: event.title, eventDate: new Date(event.eventDate), eventType: 'Judiciary Event', sourceUrl: event.sourceUrl }
        });
      } else {
        await prisma.legalEvent.create({
          data: { title: event.title, eventDate: new Date(event.eventDate), eventType: 'Judiciary Event', sourceUrl: event.sourceUrl }
        });
      }
    }
  }
  return events;
}

// Kenyan Law Review Event Scraper (if events exist)
export async function scrapeKenyanLawReviewEvents() {
  const url = 'https://www.kenyalaw.org/kl/index.php?id=453'; // Example events/news page
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const events: Array<{ title: string; eventDate?: string; eventType?: string; sourceUrl: string }> = [];
  // Example selector: update for real site structure
  $('.event-listing, .news-listing').each((_, el) => {
    const title = $(el).find('.event-title, .news-title').text().trim();
    const eventDate = $(el).find('.event-date, .news-date').text().trim();
    const href = $(el).find('a').attr('href');
    if (title && href) {
      events.push({ title, eventDate, eventType: 'Law Review Event', sourceUrl: href });
    }
  });
  for (const event of events) {
    if (event.title && event.sourceUrl) {
      const existing = await prisma.legalEvent.findFirst({ where: { sourceUrl: event.sourceUrl } });
      if (existing) {
        await prisma.legalEvent.update({
          where: { id: existing.id },
          data: { title: event.title, eventDate: event.eventDate ? new Date(event.eventDate) : new Date(), eventType: event.eventType, sourceUrl: event.sourceUrl }
        });
      } else {
        await prisma.legalEvent.create({
          data: { title: event.title, eventDate: event.eventDate ? new Date(event.eventDate) : new Date(), eventType: event.eventType, sourceUrl: event.sourceUrl }
        });
      }
    }
  }
  return events;
}
// Law Society of Kenya Event Scraper (CLE, conferences, etc.)
export async function scrapeLawSocietyEvents() {
  const url = 'https://lsk.or.ke/events/'; // Example events page
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const events: Array<{ title: string; eventDate: string; eventType?: string; sourceUrl: string }> = [];
  // Example selector: update for real site structure
  $('.event-listing').each((_, el) => {
    const title = $(el).find('.event-title').text().trim();
    const eventDate = $(el).find('.event-date').text().trim();
    const href = $(el).find('a').attr('href');
    if (title && eventDate && href) {
      events.push({ title, eventDate, eventType: 'LSK Event', sourceUrl: href });
    }
  });
  for (const event of events) {
    if (event.title && event.eventDate && event.sourceUrl) {
      const existing = await prisma.legalEvent.findFirst({ where: { sourceUrl: event.sourceUrl } });
      if (existing) {
        await prisma.legalEvent.update({
          where: { id: existing.id },
          data: { title: event.title, eventDate: new Date(event.eventDate), eventType: event.eventType, sourceUrl: event.sourceUrl }
        });
      } else {
        await prisma.legalEvent.create({
          data: { title: event.title, eventDate: new Date(event.eventDate), eventType: event.eventType, sourceUrl: event.sourceUrl }
        });
      }
    }
  }
  return events;
}
// Judiciary of Kenya Scraper
export async function scrapeJudiciaryOfKenya() {
  const url = 'https://www.judiciary.go.ke/resources/judgments/'; // Example URL
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const judgments: Array<{ title: string; url: string; date?: string }> = [];
  // Example selector: update for real site structure
  $('a').each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr('href');
    if (href && title.length > 10) {
      judgments.push({ title, url: href });
    }
  });
  const outPath = path.join(process.cwd(), 'storage', 'scraped', `judiciaryofkenya_${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(judgments, null, 2));
  return judgments;
}

// Law Society of Kenya Scraper
export async function scrapeLawSocietyOfKenya() {
  const url = 'https://lsk.or.ke/resources/'; // Example URL
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const resources: Array<{ title: string; url: string; date?: string }> = [];
  // Example selector: update for real site structure
  $('a').each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr('href');
    if (href && title.length > 10) {
      resources.push({ title, url: href });
    }
  });
  const outPath = path.join(process.cwd(), 'storage', 'scraped', `lawsocietyofkenya_${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(resources, null, 2));
  return resources;
}
import axios from 'axios';
import cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

// Example: Scrape Kenyan Law Review (customize selectors as needed)
export async function scrapeKenyanLawReview() {
  const url = 'https://www.kenyalaw.org/kl/index.php?id=453'; // Example URL
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const articles: Array<{ title: string; url: string; date?: string }> = [];

  // Example selector: update for real site structure
  $('a').each((_, el) => {
    const title = $(el).text().trim();
    const href = $(el).attr('href');
    if (href && title.length > 10) {
      articles.push({ title, url: href });
    }
  });

  // Save results to storage (or DB)
  const outPath = path.join(process.cwd(), 'storage', 'scraped', `kenyanlawreview_${Date.now()}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(articles, null, 2));
  return articles;
}

// Add similar functions for Judiciary of Kenya, Law Society of Kenya, etc.
