copil# Intelligent Legal Document Crawler - Implementation Summary

## 🎯 Overview

You requested an intelligent crawler that can automatically discover legal documents beyond manually configured websites, with automated daily scheduling at 5:00 PM. This has been fully implemented.

## ✅ What Was Built

### 1. **Intelligent Crawler Service** (`backend/src/services/intelligentLegalCrawler.ts`)

**Smart Features:**
- **Autonomous Discovery**: Follows links recursively up to 3 levels deep
- **Domain Whitelist**: Restricted to trusted sources (kenyalaw.org, judiciary.go.ke, parliament.go.ke, lsk.or.ke)
- **Link Intelligence**: Only follows legal-related links (judgments, acts, bills, cases, legal resources)
- **Document Recognition**: Automatically detects PDFs and legal documents
- **Auto-Categorization**: Classifies documents by type (LEGISLATION, CASE_LAW, STATUTORY_INSTRUMENT, LEGAL_GUIDE)
- **Duplicate Prevention**: Checks sourceUrl before ingestion
- **Rate Limiting**: 1-3 second delays between requests

**Configured Sources (Auto-Expanded During Crawl):**
- Kenya Law Reports (new.kenyalaw.org)
- Judiciary of Kenya (judiciary.go.ke - Supreme Court, Court of Appeal, High Court)
- Parliament of Kenya (parliament.go.ke - Bills, Acts)
- Law Society of Kenya (lsk.or.ke - Legal resources)

**How It Works:**
```typescript
// 1. Starts at seed URLs
// 2. Scrapes each page for links
// 3. Identifies PDFs as documents
// 4. Identifies legal-related pages to crawl further
// 5. Follows links recursively (up to maxDepth = 3)
// 6. Downloads PDFs → Extract text → Chunk → Embed → Pinecone → PostgreSQL
// 7. Respects SCRAPER_BATCH_SIZE environment variable (default 50)
```

### 2. **Automated Daily Scheduler** (`backend/src/services/crawlerScheduler.ts`)

**Features:**
- **Cron Schedule**: Runs daily at **5:00 PM East Africa Time** (Africa/Nairobi timezone)
- **Auto-Start**: Activates when backend server starts
- **Manual Trigger**: Admins can trigger immediate crawls via API
- **Status Monitoring**: Track next run time and scheduler state
- **Error Handling**: Logs failures without crashing

**Schedule Configuration:**
- Cron Expression: `0 17 * * *` (minute=0, hour=17, every day)
- Timezone: Africa/Nairobi (EAT)
- Next run calculated automatically

### 3. **Admin API Endpoints** (`backend/src/routes/admin/crawlerRoutes.ts`)

**New Routes:**
```
GET  /api/admin/crawler/status   - Get scheduler status & next run time
POST /api/admin/crawler/trigger  - Manually trigger immediate crawl
POST /api/admin/crawler/start    - Start automated scheduler
POST /api/admin/crawler/stop     - Stop automated scheduler
```

**Authorization**: Admin/Super Admin only (via authenticateToken + authorizeRoles)

### 4. **Updated Admin UI** (`frontend/src/pages/admin/AdminLegalKnowledgeBase.tsx`)

**UI Changes:**
- **Removed**: Individual scraper buttons (Kenya Law, Judiciary, LSK)
- **Added**: Single "Intelligent Crawler" section with:
  - Real-time scheduler status (Active/Inactive indicator)
  - Next crawl time display
  - Schedule information ("Daily at 5:00 PM EAT")
  - Intelligent discovery explanation
  - "Trigger Manual Crawl Now" button

**Visual Design:**
- Emerald/teal gradient background (vs old blue/purple individual buttons)
- Status badge with pulse animation when active
- Info box explaining intelligent discovery
- Loading state during crawl

### 5. **Backend Integration** (`backend/src/index.ts`)

**Auto-Start on Server Launch:**
```typescript
// Automatically starts crawler scheduler when server boots
import('./services/crawlerScheduler').then(({ crawlerScheduler }) => {
  crawlerScheduler.start();
  console.log('📚 Legal document crawler scheduled: Daily at 5:00 PM');
  console.log('⏰ Next run: [timestamp]');
});
```

## 📋 Configuration Options

**Environment Variables** (`.env`):
```bash
SCRAPER_BATCH_SIZE=50  # Max documents per crawl run
```

**Crawler Configuration** (in code):
```typescript
{
  seedUrls: [...],           // Starting points for crawling
  maxDepth: 3,               // How deep to follow links
  maxDocumentsPerRun: 50,    // Batch size (from env)
  allowedDomains: [...],     // Trusted sources only
  respectRobotsTxt: true     // Honor robots.txt rules
}
```

## 🚀 How to Use

### Automatic Daily Crawling
1. **No action required** - Scheduler auto-starts with backend server
2. Runs daily at **5:00 PM EAT**
3. Logs results to backend console
4. Updates knowledge base automatically

### Manual Triggering (Admin)
1. Navigate to **Admin Dashboard** → **AI Knowledge Base** button
2. Or directly to: http://localhost:3000/admin/legal-knowledge
3. Click **"Trigger Manual Crawl Now"** button
4. Crawler runs immediately (shows progress spinner)
5. Alert displays results when complete

### Monitoring Status
- **Frontend**: Admin Legal Knowledge Base page shows scheduler status
- **Backend Logs**: See crawler activity in console
- **API**: `GET /api/admin/crawler/status` for programmatic access

## 🔧 Technical Implementation Details

### Dependencies Installed
```bash
npm install --save node-cron @types/node-cron
```

### Files Created/Modified

**New Files:**
- `backend/src/services/intelligentLegalCrawler.ts` (378 lines)
- `backend/src/services/crawlerScheduler.ts` (121 lines)
- `backend/src/routes/admin/crawlerRoutes.ts` (135 lines)

**Modified Files:**
- `backend/src/index.ts` - Added crawler scheduler auto-start
- `frontend/src/pages/admin/AdminLegalKnowledgeBase.tsx` - Updated UI to use intelligent crawler

### Crawler Intelligence Algorithm

```
1. Load seed URLs (Kenya Law, Judiciary, Parliament, LSK)
2. For each seed URL:
   a. Fetch page HTML
   b. Parse with Cheerio
   c. Extract all links (<a href>)
   d. For each link:
      - If PDF → Add to discovered documents
      - If legal-related page → Add to crawl queue (if depth < maxDepth)
   e. Recursively crawl queued pages
3. Stop when:
   - Max depth reached (3 levels)
   - Max documents reached (SCRAPER_BATCH_SIZE)
   - All pages visited
4. Ingest discovered documents:
   a. Check for duplicates (sourceUrl)
   b. Download PDF
   c. Extract text
   d. Chunk into segments
   e. Generate OpenAI embeddings
   f. Store in Pinecone vector DB
   g. Save metadata to PostgreSQL
```

### Link Intelligence Filters

**Legal-related keywords** (case-insensitive):
- judgment, case, act, bill, legal, court, resource
- supreme-court, court-of-appeal, high-court
- parliament, legislation, statutory

**Excluded domains**:
- Social media links
- Ads, tracking pixels
- Non-legal government departments

## 📊 Expected Performance

**First Run** (Full Discovery):
- Estimated: 1-3 hours (depending on network, API quotas)
- Documents: 50-500+ (limited by SCRAPER_BATCH_SIZE)
- Cost: ~$0.01-0.10 for OpenAI embeddings

**Daily Runs** (Incremental):
- Estimated: 5-30 minutes
- Documents: 0-50 (only new additions)
- Cost: Minimal (duplicate prevention skips existing)

## 🎛️ Admin Controls

### View Scheduler Status
```bash
curl http://localhost:5000/api/admin/crawler/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "isRunning": true,
    "nextRun": "2025-12-02T14:00:00.000Z",
    "nextRunFormatted": "Monday, 2 December 2025 at 17:00",
    "schedule": "Daily at 5:00 PM (East Africa Time)"
  }
}
```

### Trigger Manual Crawl
```bash
curl -X POST http://localhost:5000/api/admin/crawler/trigger \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "message": "Crawl complete! Discovered 157 documents, ingested 43",
  "data": {
    "discovered": 157,
    "ingested": 43
  }
}
```

## ⚙️ Next Steps

### To Test Immediately
1. Restart backend server: `npm run dev` (in root directory)
2. Navigate to: http://localhost:3000/admin/legal-knowledge
3. Click **"Trigger Manual Crawl Now"** button
4. Monitor backend console for logs
5. Check statistics update after completion

### To Adjust Settings
1. **Change batch size**: Edit `SCRAPER_BATCH_SIZE=50` in `.env`
2. **Change schedule**: Edit cron expression in `crawlerScheduler.ts`:
   - Current: `'0 17 * * *'` (5:00 PM daily)
   - Examples:
     - `'0 22 * * *'` = 10:00 PM daily
     - `'0 12 * * 1'` = 12:00 PM every Monday
     - `'0 */6 * * *'` = Every 6 hours
3. **Add sources**: Edit `seedUrls` array in `intelligentLegalCrawler.ts`
4. **Change depth**: Edit `maxDepth` (current: 3 levels)

### To Monitor Crawler
- **Backend logs**: Look for `[Crawler]` prefix messages
- **Database**: Query `LegalDocument` table for new entries
- **Pinecone**: Check dashboard for vector count increases
- **Frontend stats**: "AI Knowledge Base" page updates after crawl

## 🔒 Security & Compliance

- **Domain Whitelist**: Only crawls trusted legal sources
- **Rate Limiting**: Respects server load (1-3 second delays)
- **Duplicate Prevention**: Checks before ingestion
- **User Agent**: Identifies as "WakiliPro Legal Crawler/1.0"
- **robots.txt**: Configuration option (currently enabled)

## 💡 Advantages Over Old System

| Old System | New Intelligent Crawler |
|------------|-------------------------|
| Manual URL additions | Automatic discovery |
| Separate buttons per site | Single unified crawler |
| Manual triggering only | Automated daily schedule |
| Fixed 5 URLs per site | Unlimited link following |
| Hardcoded selectors | Generic PDF detection |
| No depth exploration | 3-level recursive crawl |

## 🎉 Summary

You now have a **fully automated intelligent legal document crawler** that:
✅ Discovers documents beyond hardcoded URLs  
✅ Runs daily at 5:00 PM without manual intervention  
✅ Supports manual triggering for immediate needs  
✅ Covers Kenya Law, Judiciary, Parliament, LSK (expandable)  
✅ Auto-categorizes by document type  
✅ Prevents duplicates  
✅ Updates AI knowledge base automatically  

**No more clicking individual scraper buttons** - the system handles everything autonomously!
