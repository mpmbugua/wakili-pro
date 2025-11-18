import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Judiciary of Kenya Event Scraper
export async function scrapeJudiciaryEvents() {
  const url = 'https://www.judiciary.go.ke/events/'; // Example events page
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const events: Array<{ title: string; date: string; url: string }> = [];
  // Example selector: update for real site structure
  $('.event-listing').each((_, el) => {
    const title = $(el).find('.event-title').text().trim();
    const date = $(el).find('.event-date').text().trim();
    const href = $(el).find('a').attr('href');
    if (title && date && href) {
      events.push({ title, date, url: href });
    }
  });
  for (const event of events) {
    if (event.title && event.date && event.url) {
      await prisma.legalEvent.upsert({
        where: { url: event.url },
        update: { title: event.title, date: new Date(event.date), source: 'Judiciary of Kenya' },
        create: { title: event.title, date: new Date(event.date), url: event.url, source: 'Judiciary of Kenya' },
      });
    }
  }
  return events;
}

// Kenyan Law Review Event Scraper (if events exist)
export async function scrapeKenyanLawReviewEvents() {
  const url = 'https://www.kenyalaw.org/kl/index.php?id=453'; // Example events/news page
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const events: Array<{ title: string; date?: string; url: string }> = [];
  // Example selector: update for real site structure
  $('.event-listing, .news-listing').each((_, el) => {
    const title = $(el).find('.event-title, .news-title').text().trim();
    const date = $(el).find('.event-date, .news-date').text().trim();
    const href = $(el).find('a').attr('href');
    if (title && href) {
      events.push({ title, date, url: href });
    }
  });
  for (const event of events) {
    if (event.title && event.url) {
      await prisma.legalEvent.upsert({
        where: { url: event.url },
        update: { title: event.title, date: event.date ? new Date(event.date) : new Date(), source: 'Kenyan Law Review' },
        create: { title: event.title, date: event.date ? new Date(event.date) : new Date(), url: event.url, source: 'Kenyan Law Review' },
      });
    }
  }
  return events;
}
// Law Society of Kenya Event Scraper (CLE, conferences, etc.)
export async function scrapeLawSocietyEvents() {
  const url = 'https://lsk.or.ke/events/'; // Example events page
  const res = await axios.get(url);
  const $ = cheerio.load(res.data);
  const events: Array<{ title: string; date: string; url: string }> = [];
  // Example selector: update for real site structure
  $('.event-listing').each((_, el) => {
    const title = $(el).find('.event-title').text().trim();
    const date = $(el).find('.event-date').text().trim();
    const href = $(el).find('a').attr('href');
    if (title && date && href) {
      events.push({ title, date, url: href });
    }
  });
  for (const event of events) {
    if (event.title && event.date && event.url) {
      await prisma.legalEvent.upsert({
        where: { url: event.url },
        update: { title: event.title, date: new Date(event.date), source: 'Law Society of Kenya' },
        create: { title: event.title, date: new Date(event.date), url: event.url, source: 'Law Society of Kenya' },
      });
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
