# 🔐 Render Environment Variables - Quick Reference

## Copy-Paste Ready Variables for Render Dashboard

### Navigate to:
**Render Dashboard** → **wakili-pro-backend** → **Environment** → **Add Environment Variable**

---

## 🆕 NEW VARIABLES (Add These)

### Olympus SMS (Phone Verification)
```bash
OLYMPUS_SMS_API_KEY=47|ufBGhN49NTiEO06YMJ2rYS6gaxf20hrAxcakK4nW
SMS_SENDER_ID=WAKILIPRO
```

### Abuse Prevention
```bash
ABUSE_DETECTION_ENABLED=true
MAX_ACCOUNTS_PER_PHONE=1
MAX_ACCOUNTS_PER_IP=5
```

---

## ✅ VERIFY EXISTING (Should Already Be Set)

```bash
DATABASE_URL=postgresql://... (auto-injected by Render)
JWT_SECRET=your-jwt-secret-key
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-url.com
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=Wakili Pro <noreply@wakilipro.com>
```

---

## 📝 Olympus SMS Configuration

### API Details
- **Base URL**: https://sms.ots.co.ke/api/v3/
- **API Key**: `47|ufBGhN49NTiEO06YMJ2rYS6gaxf20hrAxcakK4nW`
- **Authentication**: Bearer token in Authorization header
- **Format**: JSON (not form-urlencoded)

### Environment Variables
```bash
OLYMPUS_SMS_API_KEY=47|ufBGhN49NTiEO06YMJ2rYS6gaxf20hrAxcakK4nW
SMS_SENDER_ID=WAKILIPRO
```

**No username required** - Olympus SMS uses API key only.

---

## 🧪 Test SMS in Production Mode

After setting `OLYMPUS_SMS_API_KEY`:

```bash
# Send test SMS via phone verification endpoint
curl -X POST \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"254712345678"}' \
  https://your-backend.onrender.com/api/verification/send-code
```

**Expected**: You'll receive SMS to Kenya number `254712345678`

**Olympus SMS Features**:
- Works with all Kenyan numbers (254...)
- Production-ready API (no sandbox mode)
- JSON-based API for easy integration
- Fast delivery times

---
## 🔒 Security Notes

### ⚠️ NEVER commit these to git:
- `OLYMPUS_SMS_API_KEY` - Sensitive credential
- `JWT_SECRET` - Security critical
- `EMAIL_PASS` - App password

### ✅ Add via Render Dashboard ONLY
- Render encrypts environment variables at rest
- Variables are injected at runtime
- Not visible in logs or API responses

---

## 📊 Variable Usage in Code

| Variable | Used By | Purpose |
|----------|---------|---------|
| `OLYMPUS_SMS_API_KEY` | `backend/src/services/smsService.ts` | SMS API authentication |
| `SMS_SENDER_ID` | `backend/src/services/smsService.ts` | Custom sender name |
| `ABUSE_DETECTION_ENABLED` | `backend/src/middleware/abusePreventionMiddleware.ts` | Enable/disable abuse checks |
| `MAX_ACCOUNTS_PER_PHONE` | `backend/src/services/abusePreventionService.ts` | Multi-account limit |
| `MAX_ACCOUNTS_PER_IP` | `backend/src/services/abusePreventionService.ts` | IP reputation check |

---
---

## 🚀 Quick Deployment Checklist
## 🚀 Quick Deployment Checklist

- [ ] Copy `OLYMPUS_SMS_API_KEY=47|ufBGhN49NTiEO06YMJ2rYS6gaxf20hrAxcakK4nW` to Render
- [ ] Copy `SMS_SENDER_ID=WAKILIPRO` to Render
- [ ] Copy `ABUSE_DETECTION_ENABLED=true` to Render
- [ ] Copy `MAX_ACCOUNTS_PER_PHONE=1` to Render
- [ ] Copy `MAX_ACCOUNTS_PER_IP=5` to Render
- [ ] Click **Save Changes** in Render (triggers redeploy)
- [ ] Wait 2-3 minutes for deployment
- [ ] Check logs for `[QuotaReset] Cron job initialized`
- [ ] Test health endpoint: `curl https://your-backend.onrender.com/health`
- [ ] Test phone verification with Kenyan number

---
## 🔄 After Adding Variables

Render will automatically:
1. ✅ Restart your service
2. ✅ Inject new variables into process.env
3. ✅ Redeploy with latest code

**Expected deployment time**: 2-3 minutes

**Watch logs for**:
```
✅ Video signaling server initialized
✅ [QuotaReset] Cron job initialized (runs 1st of month at 12:01 AM)
✅ Server listening on port 5000
```

---

## 📞 Need Help?

## 📞 Need Help?

**Olympus SMS Support**: https://sms.ots.co.ke
**Render Support**: https://render.com/docs
**Deployment Guide**: See `RENDER_DEPLOYMENT_FREEBIES.md`