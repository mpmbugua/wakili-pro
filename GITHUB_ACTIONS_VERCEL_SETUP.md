# GitHub Actions → Vercel Deployment Setup

## 🎯 Overview
This guide sets up automated deployment from GitHub to Vercel using GitHub Actions. Every push to `main` branch will automatically deploy the frontend.

## 🔧 Setup Steps

### 1. Create Vercel Project

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. **Click "New Project"** 
3. **Import `mpmbugua/wakili-pro`** repository
4. **Configure Project**:
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `
   `

### 2. Get Vercel Project IDs

After creating the project:

```bash
# Install Vercel CLI locally
npm install -g vercel


# Login and link project
cd frontend
vercel login
vercel link

# Get project details
vercel project lsvercel project ls
```

This will show:
- **Project ID**: `prj_xxxxxxxxxxxxxxxxxxxx`  
- **Org ID**: `team_xxxxxxxxxxxxxxxxxxxx`

### 3. Create Vercel API Token

1. Go to [vercel.com/account/tokens](https://vercel.com/account/tokens)
2. Click **"Create Token"**
3. Name: `GitHub Actions Deploy`
4. Scope: **Full Access** (or limit to your team)
5. **Copy the token** (starts with `vercel_...`)

### 4. Configure GitHub Secrets

Go to **GitHub repo → Settings → Secrets and variables → Actions**, add:

| Secret Name | Value | Example |
|-------------|-------|---------|
| `VERCEL_TOKEN` | Your Vercel API token | `vercel_xxxxxxxxxxxx` |
| `VERCEL_ORG_ID` | Your Org/Team ID | `team_xxxxxxxxxxxx` |
| `VERCEL_PROJECT_ID` | Your Project ID | `prj_xxxxxxxxxxxx` |

### 5. Configure Environment Variables (Optional)

In **Vercel Dashboard → Project → Settings → Environment Variables**, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_API_URL` | `https://wakili-pro.onrender.com/api` | Production |
| `VITE_APP_NAME` | `Wakili Pro` | All |
| `VITE_ENABLE_AI_ASSISTANT` | `true` | All |
| `VITE_ENABLE_VIDEO_CALLS` | `true` | All |
| `VITE_ENABLE_PAYMENTS` | `true` | All |

## 🚀 How It Works

### Automatic Deployments

1. **Push to main** → GitHub Action triggers
2. **Frontend tests** run (lint, type-check, unit tests)  
3. **Build production** bundle with environment variables
4. **Deploy to Vercel** using Vercel CLI
5. **Health check** verifies deployment
6. **Summary posted** to GitHub with live URL

### Manual Deployments

You can also trigger deployments manually:
- Go to **Actions tab** → **Deploy to Vercel** → **Run workflow**

## 🔍 Monitoring

### GitHub Actions
- View deployment logs: **Actions tab** → **Deploy to Vercel**
- Deployment summaries show live URLs and status

### Vercel Dashboard  
- Real-time deployment logs: **Vercel Dashboard → Deployments**
- Analytics and performance: **Vercel Dashboard → Analytics**

## 🐛 Troubleshooting

### Common Issues

**❌ "VERCEL_TOKEN is invalid"**
- Regenerate token at vercel.com/account/tokens
- Update GitHub secret with new token

**❌ "Project not found"** 
- Verify `VERCEL_PROJECT_ID` in GitHub secrets
- Run `vercel project ls` to get correct ID

**❌ "Build failed"**
- Check build logs in GitHub Actions
- Verify all dependencies are in `package.json`
- Test build locally: `npm run build`

**❌ "Health check failed"**
- Check Vercel deployment logs  
- Verify React app loads correctly
- Check for runtime errors in browser console

## ✅ Verification Steps

After setup, test the pipeline:

1. **Make a small change** to `frontend/src/App.tsx`
2. **Commit and push** to main branch
3. **Watch GitHub Actions** deploy automatically  
4. **Visit the deployed URL** from the action summary
5. **Test authentication** (login/register buttons)
6. **Verify backend connection** (should show "✅ Backend Connected!")

## 🔗 URLs After Setup

- **Frontend**: `https://your-project-name.vercel.app`
- **Backend**: `https://wakili-pro.onrender.com` (already deployed)
- **GitHub Actions**: `https://github.com/mpmbugua/wakili-pro/actions`
- **Vercel Dashboard**: `https://vercel.com/your-username/your-project`