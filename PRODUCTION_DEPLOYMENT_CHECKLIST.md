# 🚀 Production Deployment Checklist - Wakili Pro

## ✅ Pre-Deployment Verification

### **Local Testing Complete**
- [ ] Google OAuth login works on localhost:3000
- [ ] Facebook OAuth login works on localhost:3000
- [ ] Email/password registration works
- [ ] Dashboard loads after login
- [ ] M-Pesa payment flow tested (sandbox)
- [ ] Backend builds without errors: `npm run build`
- [ ] Frontend builds without errors: `cd frontend && npm run build`
- [ ] All tests pass: `npm run test`

---

## 📦 Render Backend Deployment

### **1. Database Migration (Already Done ✅)**
- [x] PaymentStatus enum fixed (COMPLETED→PAID, CANCELLED→REFUNDED)
- [x] OAuth fields added (googleId, facebookId, appleId, provider, avatar)
- [x] User.password made nullable

### **2. Environment Variables on Render**

Go to: https://dashboard.render.com → Your Backend Service → Environment

Add these variables:

```env
# Database
DATABASE_URL=<Auto-populated by Render PostgreSQL>

# JWT
JWT_SECRET=<Generate strong random string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Node Environment
NODE_ENV=production
PORT=5000

# Google OAuth
GOOGLE_CLIENT_ID=635497798070-n4kun3d5m7af6k4cbcmvoeehlp3igh68.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
GOOGLE_CALLBACK_URL=https://<your-backend>.onrender.com/api/auth/google/callback

# Facebook OAuth
FACEBOOK_APP_ID=2239381283209458
FACEBOOK_APP_SECRET=16d332540760ef70f057984c576a0f34
FACEBOOK_CALLBACK_URL=https://<your-backend>.onrender.com/api/auth/facebook/callback

# M-Pesa (Production Credentials - Get from Safaricom)
MPESA_CONSUMER_KEY=<Production key from Safaricom>
MPESA_CONSUMER_SECRET=<Production secret>
MPESA_SHORTCODE=<Your production shortcode>
MPESA_PASSKEY=<Production passkey>
MPESA_ENVIRONMENT=production
MPESA_CALLBACK_URL=https://<your-backend>.onrender.com/api/payments/mpesa/callback

# CORS (Allow your frontend domain)
CORS_ORIGIN=https://<your-frontend>.vercel.app,https://<your-frontend>.netlify.app

# File Upload (If using cloud storage)
CLOUDINARY_CLOUD_NAME=<Your Cloudinary name>
CLOUDINARY_API_KEY=<Your API key>
CLOUDINARY_API_SECRET=<Your API secret>
```

### **3. Build Configuration**

**Build Command**: 
```bash
cd backend && npm install && npm run build
```

**Start Command**:
```bash
cd backend && npm start
```

**Pre-Deploy Command** (Run migrations):
```bash
cd backend && npx prisma migrate deploy && npx prisma generate
```

### **4. Render Service Settings**

- **Instance Type**: Starter (or higher for production)
- **Health Check Path**: `/health` or `/api/health`
- **Auto-Deploy**: Yes (from `main` branch)
- **Region**: Select closest to Kenya (Europe or Asia)

---

## 🌐 Frontend Deployment (Vercel/Netlify)

### **Option A: Vercel**

1. **Connect Repository**
   - Go to https://vercel.com
   - Import Git Repository
   - Select `wakili-pro` repo

2. **Build Settings**
   ```
   Framework Preset: Vite
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: dist
   Install Command: npm install
   ```

3. **Environment Variables**
   ```env
   VITE_API_URL=https://<your-backend>.onrender.com
   VITE_GOOGLE_CLIENT_ID=635497798070-n4kun3d5m7af6k4cbcmvoeehlp3igh68.apps.googleusercontent.com
   VITE_FACEBOOK_APP_ID=2239381283209458
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get production URL: `https://<your-app>.vercel.app`

### **Option B: Netlify**

1. **Connect Repository**
   - Go to https://netlify.com
   - New Site from Git
   - Select repository

2. **Build Settings**
   ```
   Base directory: frontend
   Build command: npm run build
   Publish directory: frontend/dist
   ```

3. **Environment Variables** (Same as Vercel above)

4. **Redirects** (Create `frontend/public/_redirects`)
   ```
   /*    /index.html   200
   ```

---

## 🔐 OAuth Configuration Update

### **Google Cloud Console**

1. Go to: https://console.cloud.google.com/apis/credentials
2. Select your OAuth Client ID
3. **Authorized JavaScript origins**:
   - Add: `https://<your-frontend>.vercel.app`
   - Add: `https://<your-frontend>.netlify.app`
   - Keep: `http://localhost:3000` (for local testing)

4. **Authorized redirect URIs**:
   - Add: `https://<your-backend>.onrender.com/api/auth/google/callback`
   - Add: `https://<your-frontend>.vercel.app`
   - Keep: `http://localhost:5000/api/auth/google/callback`

### **Facebook Developers**

1. Go to: https://developers.facebook.com/apps
2. Select your app (ID: 2239381283209458)
3. **Settings → Basic**:
   - App Domains: Add `<your-frontend>.vercel.app`
   - Website URL: `https://<your-frontend>.vercel.app`

4. **Facebook Login → Settings**:
   - Valid OAuth Redirect URIs:
     - `https://<your-backend>.onrender.com/api/auth/facebook/callback`
     - `https://<your-frontend>.vercel.app`
   - Keep localhost URLs for testing

5. **App Mode**: Switch from Development to Live

---

## 🧪 Post-Deployment Testing

### **1. Backend Health Check**
```bash
curl https://<your-backend>.onrender.com/health
# Should return: { "status": "ok", "timestamp": "..." }
```

### **2. Frontend Loads**
- Visit: `https://<your-frontend>.vercel.app`
- Should see login page
- No console errors in DevTools

### **3. Google OAuth Test**
1. Click "Continue with Google"
2. Select Google account
3. Should redirect to dashboard
4. Check localStorage has tokens

### **4. Facebook OAuth Test**
1. Click Facebook button
2. Login with Facebook
3. Redirect to dashboard
4. Verify tokens in localStorage

### **5. Database Verification**
```sql
-- Connect to Render PostgreSQL
SELECT COUNT(*) FROM "User" WHERE "googleId" IS NOT NULL;
-- Should show users created via Google OAuth
```

---

## 🔥 M-Pesa Production Setup

### **1. Get Production Credentials from Safaricom**

1. **Apply for Safaricom Business Account**:
   - Go to: https://developer.safaricom.co.ke
   - Create production app
   - Request production credentials

2. **Production Credentials Needed**:
   - Consumer Key (different from sandbox)
   - Consumer Secret
   - Shortcode (your business paybill/till number)
   - Passkey (for production environment)

3. **Update Backend .env on Render**:
   ```env
   MPESA_ENVIRONMENT=production
   MPESA_CONSUMER_KEY=<Production key>
   MPESA_CONSUMER_SECRET=<Production secret>
   MPESA_SHORTCODE=<Your production shortcode>
   MPESA_PASSKEY=<Production passkey>
   ```

### **2. Whitelist Callback URL**

- Contact Safaricom support
- Provide: `https://<your-backend>.onrender.com/api/payments/mpesa/callback`
- Wait for approval (1-3 business days)

### **3. Test M-Pesa on Production**

1. Make test payment (small amount like KES 10)
2. Check database for Payment record
3. Verify callback received
4. Confirm money in business account

---

## 📊 Monitoring & Logs

### **Render Logs**
- Go to: Dashboard → Your Service → Logs
- Watch for:
  - ✅ "Wakili Pro Backend running on localhost:5000"
  - ⚠️ Any error stack traces
  - 🔍 API request logs

### **Vercel/Netlify Logs**
- Check build logs for any warnings
- Monitor function logs (if using serverless functions)

### **Error Tracking** (Recommended)
1. **Sentry**: https://sentry.io
   - Install: `npm install @sentry/node @sentry/react`
   - Configure in backend/frontend
   - Get real-time error alerts

2. **LogRocket**: https://logrocket.com
   - Session replay for debugging user issues

---

## 🎯 Production Checklist

Before announcing to users:

- [ ] Backend deployed and healthy
- [ ] Frontend deployed and accessible
- [ ] Google OAuth works on production
- [ ] Facebook OAuth works on production
- [ ] M-Pesa sandbox payments work
- [ ] Database migrations applied
- [ ] CORS configured correctly
- [ ] HTTPS enabled (auto by Render/Vercel)
- [ ] Environment variables secured
- [ ] Error monitoring setup (Sentry)
- [ ] Backup strategy for database
- [ ] Load testing completed
- [ ] Security audit passed

---

## 🆘 Troubleshooting

### **"Mixed Content" Error**
- **Cause**: HTTP API calls from HTTPS frontend
- **Fix**: Ensure backend uses `https://` URL, not `http://`

### **CORS Error on Production**
- **Cause**: Frontend domain not in CORS_ORIGIN
- **Fix**: Add frontend URL to backend CORS_ORIGIN env var

### **Google OAuth "redirect_uri_mismatch"**
- **Cause**: Production URL not in authorized URIs
- **Fix**: Add to Google Console (see OAuth Configuration above)

### **Database Connection Failed**
- **Cause**: DATABASE_URL incorrect or database paused
- **Fix**: Check Render dashboard, resume database if paused

### **Build Failed on Render**
- **Cause**: Missing dependencies or TypeScript errors
- **Fix**: 
  ```bash
  # Test locally first
  cd backend
  npm run build
  # Fix any errors before pushing
  ```

---

## 📞 Support Contacts

- **Render Support**: https://render.com/docs
- **Vercel Support**: https://vercel.com/support
- **Safaricom M-Pesa**: daraja@safaricom.co.ke
- **Google OAuth**: https://support.google.com/cloud
- **Facebook Developers**: https://developers.facebook.com/support

---

## ✅ Deployment Complete!

Once all checklist items are done, your app is live at:
- **Frontend**: `https://<your-app>.vercel.app`
- **Backend**: `https://<your-backend>.onrender.com`

**Next Steps**:
1. Monitor logs for first 24 hours
2. Get user feedback
3. Iterate and improve
4. Scale infrastructure as needed

🎉 **Congratulations on deploying Wakili Pro!**
