/**
 * Diagnostic script to check Kenya Law website structure
 * Run with: npx ts-node src/scripts/diagnose-kenya-law.ts
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

async function diagnoseKenyaLaw() {
  const testUrls = [
    'https://kenyalaw.org/caselaw/',
    'https://new.kenyalaw.org/judgments/',
    'https://kenyalaw.org/kl/index.php?id=398',
  ];

  for (const url of testUrls) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`🔍 Testing: ${url}`);
    console.log('='.repeat(80));

    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        maxRedirects: 5
      });

      console.log(`✓ Status: ${response.status}`);
      console.log(`✓ Content Length: ${response.data.length} bytes`);

      const $ = cheerio.load(response.data);
      const allLinks = $('a[href]');
      console.log(`✓ Total Links: ${allLinks.length}`);

      // Count different types
      let pdfLinks = 0;
      let docxLinks = 0;
      let kenyaLawLinks = 0;
      const sampleLinks: string[] = [];

      allLinks.each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;

        try {
          const fullUrl = href.startsWith('http') ? href : new URL(href, url).href;
          const lower = fullUrl.toLowerCase();

          if (lower.endsWith('.pdf') || lower.includes('.pdf?')) {
            pdfLinks++;
            if (sampleLinks.length < 3) sampleLinks.push(`PDF: ${fullUrl}`);
          }
          if (lower.endsWith('.docx') || lower.includes('.docx?')) {
            docxLinks++;
            if (sampleLinks.length < 3) sampleLinks.push(`DOCX: ${fullUrl}`);
          }
          if (fullUrl.includes('kenyalaw')) {
            kenyaLawLinks++;
            if (sampleLinks.length < 10) sampleLinks.push(`KL: ${fullUrl}`);
          }
        } catch (e) {
          // Skip invalid URLs
        }
      });

      console.log(`\n📊 Link Analysis:`);
      console.log(`   PDF links: ${pdfLinks}`);
      console.log(`   DOCX links: ${docxLinks}`);
      console.log(`   Kenya Law links: ${kenyaLawLinks}`);

      if (sampleLinks.length > 0) {
        console.log(`\n📋 Sample Links Found:`);
        sampleLinks.forEach(link => console.log(`   ${link}`));
      } else {
        console.log(`\n⚠️  No PDF/DOCX links found on this page`);
        console.log(`\nFirst 10 links found:`);
        let count = 0;
        allLinks.each((_, el) => {
          if (count >= 10) return;
          const href = $(el).attr('href');
          const text = $(el).text().trim().substring(0, 50);
          console.log(`   ${href} (${text})`);
          count++;
        });
      }

    } catch (error) {
      console.error(`❌ Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }
}

diagnoseKenyaLaw();
