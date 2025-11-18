import cron from 'node-cron';
import { scrapeKenyanLawReview, scrapeJudiciaryOfKenya, scrapeLawSocietyOfKenya } from './legalScraperService';

// Schedule: every day at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  console.log('[CRON] Starting scheduled legal scraping...');
  try {
    await scrapeKenyanLawReview();
    await scrapeJudiciaryOfKenya();
    await scrapeLawSocietyOfKenya();
    console.log('[CRON] Legal scraping completed successfully.');
  } catch (error) {
    console.error('[CRON] Legal scraping failed:', error);
  }
});
