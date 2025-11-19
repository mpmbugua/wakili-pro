# Render Manual Configuration Guide

## ⚠️ IMPORTANT: Render Dashboard Settings Override Config Files

Render's auto-detection is ignoring `render.yaml` because it detected this as a Yarn workspace.
You must **manually configure** the service in Render's dashboard.

## Steps to Fix Deployment

### 1. Go to Render Dashboard
Visit: https://dashboard.render.com/

### 2. Select Your Service
Click on `wakili-pro-backend` (or your service name)

### 3. Update Settings

Click **Settings** tab and update these fields:

#### Build & Deploy
- **Root Directory**: `backend`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

#### Advanced Settings
- **Auto-Deploy**: Yes (recommended)
- **Branch**: main

### 4. Environment Variables

Add these required variables in the **Environment** tab:

```bash
NODE_ENV=production
DATABASE_URL=<your-postgres-connection-string>
JWT_SECRET=<generate-random-string>
JWT_REFRESH_SECRET=<generate-random-string>

# Payment providers
STRIPE_SECRET_KEY=<your-stripe-key>
MPESA_CONSUMER_KEY=<your-mpesa-key>
MPESA_CONSUMER_SECRET=<your-mpesa-secret>
MPESA_BUSINESS_SHORTCODE=174379
MPESA_PASSKEY=<your-mpesa-passkey>

# OpenAI (optional)
OPENAI_API_KEY=<your-openai-key>

# AWS S3 (optional)
AWS_ACCESS_KEY_ID=<your-aws-key>
AWS_SECRET_ACCESS_KEY=<your-aws-secret>
AWS_REGION=us-east-1
AWS_S3_BUCKET=<your-bucket-name>
```

### 5. Manual Deploy

After saving settings:
1. Click **Manual Deploy** → **Deploy latest commit**
2. Watch the logs - it should now use npm instead of yarn
3. The build should find `/opt/render/project/src/backend/dist/index.js` correctly

## Why This Happens

Render auto-detects your project type based on:
1. Root `package.json` with `workspaces` field → Assumes Yarn monorepo
2. Runs `yarn workspace @wakili-pro/backend start` automatically
3. **Ignores** your `render.yaml` file

## Alternative: Use Render Blueprint (render.yaml)

If manual config doesn't work, try:

1. **Delete the existing service** in Render dashboard
2. Create **New** → **Blueprint**
3. Select your GitHub repo
4. Render will detect `render.yaml` and use those settings

## Verification

After deployment succeeds, test:
```bash
curl https://your-app.onrender.com/api/health
```

Should return: `{"status":"ok"}`
