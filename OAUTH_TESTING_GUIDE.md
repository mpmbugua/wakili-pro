# 🎉 Migration Complete - OAuth Testing Guide

## ✅ Database Migration Status

**All migrations successfully applied!**

### What Was Completed:
1. ✅ **Enum Migration**: PaymentStatus enum fixed (COMPLETED→PAID, CANCELLED→REFUNDED)
2. ✅ **OAuth Fields Added**: googleId, facebookId, appleId, provider, avatar
3. ✅ **Password Optional**: User.password is now nullable for OAuth users
4. ✅ **Prisma Client Generated**: All schema changes available in TypeScript
5. ✅ **Backend Built**: Successfully compiled with OAuth services
6. ✅ **Servers Running**: Backend (5000) + Frontend (3000) ready for testing

---

## 🧪 OAuth Testing Checklist

### **Google OAuth Test**

1. **Navigate to Login Page**
   - URL: http://localhost:3000/login
   - Should see "Continue with Google" button

2. **Click Google Login**
   - Click the Google button
   - Google OAuth popup should appear
   - Select your Google account (use: 635497798070-n4kun3d5m7af6k4cbcmvoeehlp3igh68.apps.googleusercontent.com)

3. **Verify Success**
   - Should redirect to `/dashboard`
   - Check localStorage for:
     - `accessToken` (JWT from backend)
     - `refreshToken`
     - `user` (JSON object with googleId, email, etc.)
   - Browser console should show: "Login successful"

4. **Database Verification**
   ```sql
   -- Connect to Render PostgreSQL and check:
   SELECT id, email, "googleId", provider, avatar, "emailVerified"
   FROM "User"
   WHERE "googleId" IS NOT NULL;
   ```
   - Should see user with googleId populated
   - provider should be 'google'
   - avatar should have Google profile picture URL
   - emailVerified should be true

---

### **Facebook OAuth Test**

1. **Navigate to Login Page**
   - URL: http://localhost:3000/login
   - Should see Facebook login button

2. **Click Facebook Login**
   - Facebook SDK popup should appear
   - App ID: 2239381283209458
   - Login with Facebook account

3. **Verify Success**
   - Redirect to `/dashboard`
   - Check localStorage for tokens + user object
   - Browser console: "Login successful"

4. **Database Verification**
   ```sql
   SELECT id, email, "facebookId", provider, avatar, "emailVerified"
   FROM "User"
   WHERE "facebookId" IS NOT NULL;
   ```
   - facebookId should be populated
   - provider should be 'facebook'
   - avatar should have Facebook profile picture URL

---

### **Account Linking Test** (Advanced)

Test linking OAuth to existing email/password account:

1. **Create Email/Password Account**
   - Register at: http://localhost:3000/register
   - Email: test@example.com
   - Password: Test123!

2. **Login with Google Using Same Email**
   - Use Google account with email: test@example.com
   - OAuth service should find existing user
   - Should update user with googleId

3. **Database Check**
   ```sql
   SELECT id, email, "googleId", "facebookId", provider
   FROM "User"
   WHERE email = 'test@example.com';
   ```
   - Single user record with both googleId AND existing data

---

## 🔍 Browser DevTools Testing

### **Network Tab Checks**

1. **Google OAuth Flow**
   ```
   POST http://localhost:5000/api/auth/google
   Request Body: { idToken: "eyJ..." }
   Response: {
     user: { id, email, googleId, ... },
     accessToken: "eyJ...",
     refreshToken: "..."
   }
   Status: 200 OK
   ```

2. **Facebook OAuth Flow**
   ```
   POST http://localhost:5000/api/auth/facebook
   Request Body: { accessToken: "EAA..." }
   Response: (same structure as Google)
   Status: 200 OK
   ```

### **Console Checks**

Look for:
- ✅ "Login successful" messages
- ✅ No CORS errors
- ✅ No 401/403 errors
- ✅ Google/Facebook SDK loaded successfully

---

## 🐛 Troubleshooting

### **Google Login Shows "idToken required"**
- **Cause**: Frontend not sending idToken to backend
- **Fix**: Check SocialLoginButtons.tsx onSuccess handler

### **Facebook Login Fails with "Invalid OAuth access token"**
- **Cause**: Facebook App ID mismatch or token expired
- **Fix**: Verify FACEBOOK_APP_ID in .env matches frontend

### **"googleId does not exist in type UserWhereUniqueInput"**
- **Cause**: Prisma client not regenerated
- **Fix**: 
  ```powershell
  cd backend
  Remove-Item -Path "..\node_modules\.prisma" -Recurse -Force
  npx prisma generate
  npm run build
  ```

### **Database Connection Errors**
- **Check**: Backend .env has correct Render DATABASE_URL
- **Verify**: 
  ```powershell
  cd backend
  npx prisma db pull  # Should succeed without errors
  ```

---

## 📊 Production Readiness

### **Before Deploying to Render:**

1. **Update OAuth Callback URLs**
   - Google Console: https://console.cloud.google.com/apis/credentials
     - Change: http://localhost:5000 → https://your-backend.onrender.com
   - Facebook Developers: https://developers.facebook.com/apps
     - Add production domain to Valid OAuth Redirect URIs

2. **Environment Variables on Render**
   ```env
   DATABASE_URL=<Render PostgreSQL URL>
   GOOGLE_CLIENT_ID=635497798070-n4kun3d5m7af6k4cbcmvoeehlp3igh68.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=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
   FACEBOOK_APP_ID=2239381283209458
   FACEBOOK_APP_SECRET=16d332540760ef70f057984c576a0f34
   JWT_SECRET=<your-secret>
   NODE_ENV=production
   ```

3. **Update Frontend OAuth Config**
   - `frontend/src/App.tsx`: GoogleOAuthProvider clientId (same)
   - `frontend/src/components/auth/SocialLoginButtons.tsx`: 
     - Change API URL: http://localhost:5000 → https://your-backend.onrender.com

4. **Pre-Deploy Command on Render**
   ```bash
   npx prisma migrate deploy && npx prisma generate
   ```

---

## ✅ Migration Verification SQL

Run these queries on Render database to confirm everything:

```sql
-- 1. Check PaymentStatus enum (should have PAID, REFUNDED, not COMPLETED, CANCELLED)
SELECT enumlabel FROM pg_enum 
WHERE enumtypid = 'PaymentStatus'::regtype
ORDER BY enumlabel;

-- 2. Verify User table has OAuth columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User'
AND column_name IN ('googleId', 'facebookId', 'appleId', 'provider', 'avatar', 'password')
ORDER BY column_name;

-- 3. Check unique constraints exist
SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_type = 'UNIQUE'
AND table_name = 'User'
AND constraint_name LIKE '%_googleId_%' OR constraint_name LIKE '%_facebookId_%';

-- 4. Count OAuth users
SELECT 
  COUNT(*) FILTER (WHERE "googleId" IS NOT NULL) as google_users,
  COUNT(*) FILTER (WHERE "facebookId" IS NOT NULL) as facebook_users,
  COUNT(*) FILTER (WHERE "appleId" IS NOT NULL) as apple_users,
  COUNT(*) as total_users
FROM "User";
```

---

## 🎯 Next Steps After Testing

Once OAuth is confirmed working:

1. **E2E Testing**
   - Test full user journey: Login → Dashboard → Book Service → Pay
   - Test monetization features (LawyerTier, DocumentTier)
   - Test M-Pesa payments

2. **Production Deployment**
   - Deploy backend to Render
   - Deploy frontend to Vercel/Netlify
   - Update OAuth redirect URLs
   - Test on production

3. **Additional Features** (Future)
   - Add Apple Sign In (requires $99/year Apple Developer account)
   - OAuth profile picture syncing
   - Account linking UI (link multiple providers to one account)
   - Admin panel for OAuth user management

---

## 📞 Testing Support

**Current Status**: ✅ All migrations complete, servers running

**Quick Test**: Visit http://localhost:3000/login and try Google/Facebook login

**Need Help?**: Check console logs in:
- Browser DevTools (F12)
- Backend terminal (PowerShell with npm run dev:backend)
- Frontend terminal (Vite output)

---

**Ready to test! 🚀** Navigate to http://localhost:3000/login
