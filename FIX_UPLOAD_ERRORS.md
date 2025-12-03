# 🚨 URGENT: Fix Document Upload Issues

## Problem Summary

You're seeing 3 errors:
1. ❌ **PINECONE_API_KEY not found** → Environment variable not configured on Render.com
2. ❌ **OpenAI 429 Error (Quota Exceeded)** → Your API key ran out of credits
3. ❌ **Failed to upload document** → Both issues above prevent uploads

---

## ⚡ IMMEDIATE FIX (Required)

### Step 1: Fix OpenAI API Key (BLOCKING ALL UPLOADS)

Your OpenAI account has **$0 credits remaining**. Choose one option:

**Option A: Add Credits (Recommended)**
1. Go to: https://platform.openai.com/account/billing
2. Click "Add payment method"
3. Add $5-$10 credits
4. Wait 5 minutes for quota refresh

**Option B: Get New API Key**
1. Create new OpenAI account (if you have another email)
2. Go to: https://platform.openai.com/api-keys
3. Click "Create new secret key"
4. Copy key (format: `sk-proj-xxxxx`)

### Step 2: Configure Render.com Environment Variables

**Render does NOT use your local `.env` file** - you must configure variables in their dashboard.

1. **Login**: https://dashboard.render.com/
2. **Select Service**: Click on `wakili-pro` (backend)
3. **Environment Tab**: Left sidebar → "Environment"
4. **Add Variables**: Click "Add Environment Variable"

**Add these CRITICAL variables:**

| Key | Value |
|-----|-------|
| `OPENAI_API_KEY` | `sk-proj-[YOUR_NEW_KEY_HERE]` |
| `PINECONE_API_KEY` | `pcsk_ycijR_HidYJUduoGcG4dezZ7JaJj2vv1Qoj4zXyatztFjdqwP3a8EoLPfezyYYJ2c2fzJ` |
| `PINECONE_ENVIRONMENT` | `us-east-1` |
| `PINECONE_INDEX_NAME` | `wakili-legal-kb` |
| `PINECONE_HOST` | `https://wakili-legal-kb-96iuagg.svc.aped-4627-b74a.pinecone.io` |

5. **Save Changes** → Render will auto-redeploy (2-3 minutes)

---

## 📋 Complete Environment Variables List

Copy-paste these into Render:

```bash
# AI/Vector Database (CRITICAL)
OPENAI_API_KEY=sk-proj-[GET_NEW_KEY]
PINECONE_API_KEY=pcsk_ycijR_HidYJUduoGcG4dezZ7JaJj2vv1Qoj4zXyatztFjdqwP3a8EoLPfezyYYJ2c2fzJ
PINECONE_ENVIRONMENT=us-east-1
PINECONE_INDEX_NAME=wakili-legal-kb
PINECONE_HOST=https://wakili-legal-kb-96iuagg.svc.aped-4627-b74a.pinecone.io

# Database
DATABASE_URL=postgresql://wakiliprodb_user:eLJ8egjayfc1DswG7ubTVRpWpkIT3shU@dpg-d4bi7bqli9vc73dgc4j0-a.oregon-postgres.render.com/wakiliprodb

# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://wakili-pro-1.onrender.com
CORS_ORIGIN=https://wakili-pro-1.onrender.com

# JWT
JWT_SECRET=dev-jwt-secret-key-for-development-only-not-for-production-use
JWT_REFRESH_SECRET=dev-refresh-secret-key-for-development-only-not-for-production

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=mpmbugua.peter@gmail.com
EMAIL_PASS=cqkaxvntryotclpn
EMAIL_FROM=Wakili Pro <mpmbugua.peter@gmail.com>

# M-Pesa
MPESA_CONSUMER_KEY=N9ro1AXVEhD5vJFO5PRLlVYU6z7zINsd4GRtX6Y9XoAdr4YP
MPESA_CONSUMER_SECRET=AaZE6zkQ6LevgbSTNhEU2sv9AiUMuUoBnpCF2p7TimEB2fiA5QdZazm51d2v5WOG
MPESA_SHORTCODE=174379
MPESA_PASSKEY=bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919
MPESA_ENVIRONMENT=sandbox

# SMS
AFRICASTALKING_API_KEY=atsk_39271a142d5f9a6e4f7cf88e34966c1704c10d572ba7dc1353107a8e25089908335f1be3
AFRICASTALKING_USERNAME=sandbox

# Cloudinary
CLOUDINARY_CLOUD_NAME=dnvmclafv
CLOUDINARY_API_KEY=461962792668799
CLOUDINARY_API_SECRET=1SPuB0A6naxNn-65yLuqQhfUjJA
```

---

## ✅ Verification Steps

After configuring Render environment variables:

1. **Wait for deployment** (2-3 minutes)
2. **Test Pinecone diagnostics**: https://wakili-pro-1.onrender.com/admin/pinecone-test
3. **Click "Run Connection Test"**
4. **Verify all checks pass**:
   - ✅ Environment variables found
   - ✅ Pinecone initialized
   - ✅ Embeddings generated (1536 dimensions)
   - ✅ Vector operations working

---

## 🔍 How to Check Current Render Variables

1. Render Dashboard → `wakili-pro` → **Environment** tab
2. You should see ~30-40 environment variables
3. **Missing?** → Add them using the instructions above

---

## 🚀 After Setup Works

Once environment is configured:

1. ✅ Manual document upload will work
2. ✅ Kenya Law crawler will work
3. ✅ AI chat will have legal knowledge
4. ✅ Document review service functional

---

**Need help?** Check Render logs:
Dashboard → wakili-pro → **Logs** tab → Look for startup errors
