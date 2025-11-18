import { Router } from 'express';
import { scrapeKenyanLawReview, scrapeJudiciaryOfKenya, scrapeLawSocietyOfKenya, scrapeLawSocietyEvents, scrapeJudiciaryEvents, scrapeKenyanLawReviewEvents } from '../../services/legalScraperService';

const router = Router();
// Admin endpoint to trigger Judiciary of Kenya event scraping
router.post('/scrape/judiciary-events', async (req, res) => {
  try {
    const events = await scrapeJudiciaryEvents();
    res.json({ success: true, count: events.length, events });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Admin endpoint to trigger Kenyan Law Review event/news scraping
router.post('/scrape/kenyan-law-review-events', async (req, res) => {
  try {
    const events = await scrapeKenyanLawReviewEvents();
    res.json({ success: true, count: events.length, events });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
// Admin endpoint to trigger Law Society of Kenya event scraping
router.post('/scrape/law-society-events', async (req, res) => {
  try {
    const events = await scrapeLawSocietyEvents();
    res.json({ success: true, count: events.length, events });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});



// Admin endpoint to trigger scraping
router.post('/scrape/kenyan-law-review', async (req, res) => {
  try {
    const articles = await scrapeKenyanLawReview();
    res.json({ success: true, count: articles.length, articles });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Admin endpoint to trigger Judiciary of Kenya scraping
router.post('/scrape/judiciary-of-kenya', async (req, res) => {
  try {
    const judgments = await scrapeJudiciaryOfKenya();
    res.json({ success: true, count: judgments.length, judgments });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Admin endpoint to trigger Law Society of Kenya scraping
router.post('/scrape/law-society-of-kenya', async (req, res) => {
  try {
    const resources = await scrapeLawSocietyOfKenya();
    res.json({ success: true, count: resources.length, resources });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// TODO: Add endpoints for Judiciary of Kenya, Law Society of Kenya

export default router;
