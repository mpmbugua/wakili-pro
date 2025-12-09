# 🚀 Render Deployment Guide - Freebies System

## Overview
This guide covers deploying the complete freebies implementation (Steps 1-17) to Render production environment.

**Status**: Database schema already applied ✅ (13 migrations, no new migration needed)

---

## 📋 Pre-Deployment Checklist

### ✅ Completed
- [x] Backend code complete (Steps 1-17)
- [x] Frontend code complete (Steps 1-17)
- [x] Database schema up to date (13 migrations applied)
- [x] Cron jobs integrated (`initializeQuotaResetCron` in index.ts)
- [x] Analytics service implemented
- [x] Abuse prevention middleware applied
- [x] Phone verification system implemented

### ⏳ Deployment Tasks
- [ ] Add new environment variables to Render
- [ ] Commit and push code changes
- [ ] Verify backend deployment
- [ ] Test freebies functionality
- [ ] Monitor logs for cron job initialization

---

## 🔐 Required Environment Variables

### Add to Render Backend Service

Navigate to: **Render Dashboard** → **wakili-pro-backend** → **Environment** → **Add Environment Variable**

#### **1. Olympus SMS (Phone Verification)**
```bash
OLYMPUS_SMS_API_KEY=47|ufBGhN49NTiEO06YMJ2rYS6gaxf20hrAxcakK4nW
SMS_SENDER_ID=WAKILIPRO
```

**How to get credentials:**
- **Base URL**: https://sms.ots.co.ke/api/v3/
- **API Key**: Already provided above
- **No username required** - Uses Bearer token authentication
- **Format**: JSON (not form-urlencoded)

#### **2. Abuse Prevention Configuration**
```bash
ABUSE_DETECTION_ENABLED=true
MAX_ACCOUNTS_PER_PHONE=1
MAX_ACCOUNTS_PER_IP=5
```

#### **3. Verify Existing Variables**
Ensure these are already set:
- ✅ `DATABASE_URL` (auto-injected by Render PostgreSQL)
- ✅ `JWT_SECRET`
- ✅ `NODE_ENV=production`
- ✅ `PORT=5000`
- ✅ `FRONTEND_URL` (your frontend URL)
- ✅ Email credentials (EMAIL_HOST, EMAIL_USER, EMAIL_PASS)

---

## 🚢 Deployment Steps

### Step 1: Commit and Push Changes

```powershell
# Check status
git status

# Add all changes
git add .

# Commit with descriptive message
git commit -m "feat: Complete freebies system implementation

- Add 4 client one-time freebies (AI review, service request, consultation, PDF)
- Add lawyer monthly quotas (AI reviews, PDF downloads) with tier limits
- Implement phone verification (SMS via AfricasTalking)
- Add abuse prevention (multi-account detection, IP tracking)
- Create quota reset cron job (1st of month 12:01 AM)
- Build analytics tracking system (self-hosted)
- Add quota dashboard widget for lawyers
- Create UpgradePromptModal with ROI calculator
- Apply security middleware to all freebie endpoints
- Add FREE badges across UI (landing, marketplace, service selection)

Steps 1-17 complete. Schema already applied to production database."

# Push to repository (triggers auto-deploy on Render)
git push origin main
```

### Step 2: Monitor Deployment

1. **Open Render Dashboard**: https://dashboard.render.com
2. **Navigate to**: wakili-pro-backend service
3. **Watch Logs**: Check for deployment progress
4. **Expected logs**:
   ```
   [Build] Installing dependencies...
   [Build] Building TypeScript...
   [Deploy] Starting server...
   ✅ Video signaling server initialized
   [QuotaReset] Cron job initialized (runs 1st of month at 12:01 AM)
   [AnalyticsArchive] Auto-archiving scheduled (1st of month at 2:00 AM)
   🚀 Server listening on port 5000
   ```

### Step 3: Add Environment Variables

While deployment is running:

1. Go to **Environment** tab
2. Click **Add Environment Variable**
3. Add each variable from section above
4. Click **Save Changes** (will trigger auto-redeploy)

---

## 🧪 Post-Deployment Testing

### Test 1: Health Check
```bash
curl https://your-backend.onrender.com/health
# Expected: {"status":"OK","message":"Wakili Pro Backend is running",...}
```

### Test 2: Quota Status Endpoint (Lawyers Only)
```bash
# Get JWT token from login
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://your-backend.onrender.com/api/quotas/status
     
# Expected response:
{
  "success": true,
  "data": {
    "aiReviews": {
      "limit": 5,
      "used": 0,
      "remaining": 5,
      "resetsAt": "2025-02-01T00:01:00.000Z",
      "isUnlimited": false
    },
    "pdfDownloads": {
      "limit": 3,
      "used": 0,
      "remaining": 3,
      "resetsAt": "2025-02-01T00:01:00.000Z",
      "isUnlimited": false
    },
    "tier": "FREE",
    "nextResetDate": "2025-02-01"
  }
}
```

### Test 3: Analytics Endpoint
```bash
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"eventName":"test_event","properties":{"test":true}}' \
     https://your-backend.onrender.com/api/analytics/track
     
# Expected: {"success":true,"message":"Event tracked successfully"}
```

### Test 4: Phone Verification
```bash
# Send verification code
curl -X POST \
     -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"phoneNumber":"254712345678"}' \
     https://your-backend.onrender.com/api/verification/send-code
     
# Expected: {"success":true,"message":"Verification code sent","expiresIn":600}
```

---

## 🎯 Functional Testing Checklist

### Client Freebies (Create 4 New Test Accounts)

#### **Test 1: First AI Review FREE**
1. Create new client account
2. Login and navigate to `/documents`
3. Upload a document
4. Select "AI Review Only" (should show "FREE for first-time users" badge)
5. Click "Proceed to M-Pesa Payment"
6. **Expected**: Payment skipped, review starts immediately
7. **Verify**: `hasUsedFreeReview` flag set to `true` in database
8. **Check logs**: Should see `[DocumentReview] Using free AI review` message

#### **Test 2: First Service Request FREE**
1. Create new client account
2. Navigate to `/service-request`
3. Fill service details (should see green "First Service Request FREE!" banner)
4. Submit form
5. **Expected**: KES 500 commitment fee waived, request created immediately
6. **Verify**: `freeServiceRequestUsed` flag set to `true`
7. **Check logs**: Should see `[ServiceRequest] Using free service request` message

#### **Test 3: First Consultation 50% OFF**
1. Create new client account
2. Navigate to `/lawyer-search`, select a lawyer with discount enabled
3. Book consultation (should see "50% OFF your first consultation!" banner)
4. **Expected**: Rate halved (e.g., KES 5,000 → KES 2,500)
5. Complete payment
6. **Verify**: `hasUsedFirstConsultDiscount` flag set to `true`
7. **Check logs**: Should see `[Consultation] Applied 50% discount` message

#### **Test 4: First PDF Download FREE**
1. Create new client account
2. Navigate to `/marketplace`
3. Select a template (should see "Choose 1 FREE Template! 🎉" banner)
4. Click download
5. **Expected**: Payment skipped, PDF generated immediately
6. **Verify**: `freePDFDownloadUsed` flag set to `true`
7. **Check logs**: Should see `[Marketplace] Using free PDF download` message

---

### Lawyer Quotas (Create 1 Lawyer Test Account)

#### **Test 5: AI Review Monthly Quota**
1. Create new lawyer account (FREE tier, 5 AI reviews/month)
2. **Optional**: Verify phone number if `requirePhoneVerification` is enabled
3. Navigate to lawyer dashboard, check "Monthly Quotas" card
4. **Expected**: "AI Reviews: 0/5 used, 5 remaining"
5. Upload and review 5 documents using AI review
6. Try 6th review
7. **Expected**: 402 Payment Required error with upgrade prompt
8. **Check modal**: Should see UpgradePromptModal with LITE tier recommendation
9. **Verify**: `freeAIReviewsUsed` = 5 in database

#### **Test 6: PDF Download Monthly Quota**
1. Same lawyer account as Test 5
2. Download 3 marketplace templates
3. **Expected**: Downloads succeed
4. Try 4th download
5. **Expected**: 402 Payment Required with upgrade prompt
6. **Verify**: `freePDFDownloadsUsed` = 3 in database

---

### Abuse Prevention

#### **Test 7: Multi-Account Detection**
1. Create account with phone `254712345678`
2. Logout
3. Try creating second account with same phone
4. **Expected**: 403 Forbidden error: "Phone number already registered"
5. **Verify**: `suspiciousActivityFlag` may be set on second attempt

#### **Test 8: Phone Verification Requirement**
1. Create lawyer account (FREE tier)
2. Try using AI review quota WITHOUT verifying phone
3. **Expected**: 403 Forbidden: "Phone verification required"
4. Verify phone via `/verification` page
5. Try AI review again
6. **Expected**: Review succeeds

#### **Test 9: IP Reputation Check**
1. Create 6+ accounts from same IP address
2. **Expected**: 6th account creation should fail or trigger manual review flag
3. **Check logs**: Should see `[AbuseDetection] Flagged IP: X.X.X.X (6 accounts)`

---

## 📊 Analytics Verification

### Check Database for Events

```sql
-- Connect to production database via Render console or psql

-- Verify freebie usage events
SELECT 
  eventName,
  properties->>'freebieType' as freebie_type,
  COUNT(*) as event_count,
  COUNT(DISTINCT "userId") as unique_users
FROM "AnalyticsEvent"
WHERE eventName = 'freebie_used'
  AND "createdAt" >= NOW() - INTERVAL '1 day'
GROUP BY eventName, freebie_type;

-- Verify quota exhaustion events
SELECT 
  properties->>'tier' as tier,
  properties->>'quotaType' as quota_type,
  COUNT(*) as exhaustion_count
FROM "AnalyticsEvent"
WHERE eventName = 'quota_exhausted'
GROUP BY tier, quota_type;

-- Verify upgrade prompt tracking
SELECT 
  eventName,
  COUNT(*) as event_count
FROM "AnalyticsEvent"
WHERE eventName IN ('upgrade_prompt_shown', 'upgrade_prompt_dismissed')
  AND "createdAt" >= NOW() - INTERVAL '1 day'
GROUP BY eventName;

-- Check for abuse flags
SELECT 
  COUNT(*) as flagged_accounts,
  COUNT(DISTINCT "lastLoginIP") as unique_ips
FROM "User"
WHERE "suspiciousActivityFlag" = true;
```

---

## 🔍 Monitoring & Logs

### Key Log Messages to Watch

#### ✅ Successful Initialization
```
[QuotaReset] Cron job initialized (runs 1st of month at 12:01 AM)
[AnalyticsArchive] Auto-archiving scheduled (1st of month at 2:00 AM)
```

#### ✅ Freebie Usage
```
[DocumentReview] Using free AI review for user: abc123
[ServiceRequest] Using free service request for user: abc123
[Consultation] Applied 50% discount for user: abc123
[Marketplace] Using free PDF download for user: abc123
```

#### ✅ Quota Consumption
```
[QuotaService] AI review consumed: 1/5 used (user: abc123, tier: FREE)
[QuotaService] PDF download consumed: 2/3 used (user: abc123, tier: FREE)
```

#### ✅ Quota Exhaustion
```
[QuotaService] AI review quota exhausted (user: abc123, tier: FREE)
[QuotaService] PDF download quota exhausted (user: abc123, tier: FREE)
```

#### ✅ Abuse Detection
```
[AbuseDetection] Multi-account pattern detected for phone: 254712345678
[AbuseDetection] Flagged IP: 192.168.1.1 (6 accounts)
[AbuseDetection] Suspicious activity flagged for user: abc123 (Reason: Multiple accounts)
```

#### ✅ Cron Jobs (1st of Month)
```
[QuotaReset] Starting monthly quota reset...
[QuotaReset] Reset quotas for 150 lawyers
[QuotaReset] Sent 150 quota refresh email notifications
[QuotaReset] Monthly quota reset completed in 2.3s

[AnalyticsArchive] Starting auto-archiving...
[AnalyticsArchive] Archived 25,340 events older than 12 months
[AnalyticsArchive] Auto-archiving completed in 8.7s
```

### Access Logs on Render

1. **Real-time logs**: Render Dashboard → wakili-pro-backend → Logs tab
2. **Filter logs**: Use search bar to filter by `[QuotaReset]`, `[AbuseDetection]`, etc.
3. **Download logs**: Click "Download Logs" for offline analysis

---

## 🚨 Troubleshooting

### Issue 1: Cron Jobs Not Running

**Symptoms**: No `[QuotaReset]` or `[AnalyticsArchive]` logs in console

**Solution**:
```bash
# Check if cron is initialized
grep "initializeQuotaResetCron" backend/src/index.ts

# Verify cron syntax
grep "1 0 1 \* \*" backend/src/cron/quotaResetCron.ts

# Test manually via database query
UPDATE "User" SET "freeAIReviewsUsed" = 0, "freePDFDownloadsUsed" = 0 
WHERE role = 'LAWYER';
```

### Issue 2: SMS Not Sending

**Symptoms**: Phone verification fails, no SMS received

**Solution**:
1. Check environment variables:
   - `OLYMPUS_SMS_API_KEY=47|ufBGhN49NTiEO06YMJ2rYS6gaxf20hrAxcakK4nW`
2. Check logs for `[SMS SERVICE - DEV MODE]` (means NODE_ENV != production)
3. Verify phone number format: `254XXXXXXXXX` (Kenya)
4. Check Olympus SMS dashboard for quota/credits: https://sms.ots.co.ke
5. Test manually:
   ```bash
   curl -X POST https://sms.ots.co.ke/api/v3/sms/send \
     -H "Authorization: Bearer 47|ufBGhN49NTiEO06YMJ2rYS6gaxf20hrAxcakK4nW" \
     -H "Content-Type: application/json" \
     -d '{"to":"+254712345678","message":"Test","sender_id":"WAKILIPRO"}'
   ```

### Issue 3: Quotas Not Resetting

**Symptoms**: Quota counters stuck after 1st of month

**Solution**:
```sql
-- Check lastQuotaReset dates
SELECT 
  email, 
  "freeAIReviewsUsed", 
  "freePDFDownloadsUsed",
  "lastQuotaReset"
FROM "User"
WHERE role = 'LAWYER'
ORDER BY "lastQuotaReset" DESC;

-- Manual reset (if needed)
UPDATE "User" 
SET 
  "freeAIReviewsUsed" = 0,
  "freePDFDownloadsUsed" = 0,
  "lastQuotaReset" = NOW()
WHERE role = 'LAWYER';
```

### Issue 4: Abuse Detection Too Aggressive

**Symptoms**: Legitimate users getting flagged

**Solution**:
```bash
# Temporarily increase limits in Render environment
MAX_ACCOUNTS_PER_IP=10  # From 5 to 10
ABUSE_DETECTION_ENABLED=false  # Disable temporarily

# Or clear flags in database
UPDATE "User" SET "suspiciousActivityFlag" = false WHERE id = 'user-id';
```

### Issue 5: Analytics Not Tracking

**Symptoms**: No events in `AnalyticsEvent` table

**Solution**:
1. Check frontend API calls: Network tab → Filter `/api/analytics/track`
2. Verify backend route mounted: `grep "app.use('/api/analytics'" backend/src/index.ts`
3. Check database permissions: `SELECT * FROM "AnalyticsEvent" LIMIT 1;`
4. Verify non-blocking calls don't throw errors: Check frontend console

---

## 📈 Success Metrics (Monitor for 2 Months)

### Week 1-2 KPIs
- [ ] **Freebie adoption rate**: Target 70%+ of new users claim at least 1 freebie
- [ ] **Phone verification rate**: Target 80%+ lawyers verify phone
- [ ] **Multi-account detection rate**: < 5% false positives
- [ ] **Cron job reliability**: 100% monthly quota resets on 1st of month

### Month 1 KPIs
- [ ] **Quota exhaustion timing**: FREE tier lawyers exhaust quotas in 2-3 weeks (avg)
- [ ] **Upgrade prompt CTR**: Target 15%+ click-through to upgrade page
- [ ] **Conversion rate**: Target 35% FREE→LITE, 30% LITE→PRO
- [ ] **Revenue impact**: Target +KES 200K from tier upgrades

### Month 2 KPIs
- [ ] **Retention**: 60%+ of upgraded lawyers stay on paid tier
- [ ] **Feature usage**: AI reviews increase 200%, PDF downloads increase 150%
- [ ] **Platform commission**: Service request 20% commission model yields +KES 100K

### SQL Queries for KPI Tracking

```sql
-- Freebie adoption rate (last 30 days)
SELECT 
  COUNT(DISTINCT CASE WHEN "hasUsedFreeReview" = true THEN id END) * 100.0 / COUNT(*) as ai_review_adoption_pct,
  COUNT(DISTINCT CASE WHEN "freeServiceRequestUsed" = true THEN id END) * 100.0 / COUNT(*) as service_request_adoption_pct,
  COUNT(DISTINCT CASE WHEN "hasUsedFirstConsultDiscount" = true THEN id END) * 100.0 / COUNT(*) as consultation_adoption_pct,
  COUNT(DISTINCT CASE WHEN "freePDFDownloadUsed" = true THEN id END) * 100.0 / COUNT(*) as pdf_adoption_pct
FROM "User"
WHERE role = 'CLIENT' 
  AND "createdAt" >= NOW() - INTERVAL '30 days';

-- Quota exhaustion timing (FREE tier lawyers)
SELECT 
  AVG(EXTRACT(DAY FROM (first_exhaustion_date - "createdAt"))) as avg_days_to_exhaust_quota
FROM "User" u
LEFT JOIN LATERAL (
  SELECT MIN("createdAt") as first_exhaustion_date
  FROM "AnalyticsEvent"
  WHERE "userId" = u.id 
    AND eventName = 'quota_exhausted'
) ae ON true
WHERE u.role = 'LAWYER'
  AND u."subscriptionTier" = 'FREE'
  AND ae.first_exhaustion_date IS NOT NULL;

-- Upgrade conversion funnel
SELECT 
  properties->>'fromTier' as from_tier,
  properties->>'toTier' as to_tier,
  COUNT(*) as conversions,
  AVG((properties->>'daysToConvert')::numeric) as avg_days_to_convert
FROM "AnalyticsEvent"
WHERE eventName = 'upgrade_conversion'
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY from_tier, to_tier;

-- Revenue impact from tier upgrades
SELECT 
  properties->>'toTier' as tier,
  COUNT(*) as upgrade_count,
  SUM(CASE 
    WHEN properties->>'toTier' = 'LITE' THEN 2999
    WHEN properties->>'toTier' = 'PRO' THEN 4999
    ELSE 0
  END) as total_revenue_kes
FROM "AnalyticsEvent"
WHERE eventName = 'upgrade_conversion'
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY tier;
```

---

## 🎯 Next Steps After Deployment

### Immediate (Day 1-7)
1. ✅ Monitor deployment logs for errors
2. ✅ Test all 9 functional scenarios above
3. ✅ Verify cron jobs initialize correctly
4. ✅ Check analytics events are being tracked
5. ✅ Confirm SMS verification works (send test code)

### Short-term (Week 2-4)
1. 📊 Run KPI queries daily to track adoption
2. 🔍 Review abuse detection false positives
3. 📧 Monitor email deliverability for quota notifications
4. 🐛 Fix any bugs discovered in testing
5. 📈 Analyze upgrade prompt dismissal reasons

### Long-term (Month 2+)
1. 🧪 A/B test upgrade modal messaging (ROI vs productivity focus)
2. ⚙️ Adjust quota limits based on exhaustion timing
3. 💰 Optimize tier pricing based on conversion data
4. 🎨 Refine UI/UX based on user feedback
5. 📊 Create executive dashboard with key metrics

---

## 📞 Support

If issues arise during deployment:

1. **Check Render logs**: Real-time logs in dashboard
2. **Database queries**: Use Render console to run SQL diagnostics
3. **Environment variables**: Verify all required vars are set
4. **Test endpoints**: Use curl commands above to validate API
5. **Rollback**: If critical issue, revert commit: `git revert HEAD && git push`

---

## ✅ Deployment Completion Checklist

- [ ] Code pushed to repository
- [ ] Render backend auto-deployed successfully
- [ ] All environment variables added
- [ ] Health check returns 200 OK
- [ ] Quota status endpoint works
- [ ] Analytics endpoint works
- [ ] Phone verification SMS sends
- [ ] Cron job initialization logs visible
- [ ] All 9 functional tests passed
- [ ] Analytics events in database
- [ ] No critical errors in logs

**Once all items checked, freebies system is LIVE in production! 🎉**

Continue to **Step 20: Monitor and Optimize** (2-month tracking phase).
