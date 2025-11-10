# 🚀 Deploy Wakili Pro to Render.com

## 📋 **Step-by-Step Deployment Guide**

### **Step 1: Access Render Dashboard**
1. Go to https://render.com
2. Sign up/Login (you can use GitHub account for easy integration)
3. Click "New +" → "Web Service"

### **Step 2: Connect GitHub Repository**
1. Choose "Build and deploy from a Git repository"
2. Connect your GitHub account if not already connected
3. Find and select: `mpmbugua/wakili-pro`
4. Click "Connect"

### **Step 3: Configure Web Service**
**Basic Settings:**
- **Name**: `wakili-pro-backend`
- **Region**: Choose closest to you (e.g., Oregon, Frankfurt)
- **Branch**: `main`
- **Root Directory**: `backend`

**Build & Deploy Settings:**
- **Runtime**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**Advanced Settings:**
- **Auto-Deploy**: Yes (deploys on every Git push)
- **Health Check Path**: `/health`

### **Step 4: Environment Variables** (if needed)
- **NODE_ENV**: `production`
- **PORT**: (automatically set by Render - don't add this)

### **Step 5: Deploy**
1. Click "Create Web Service"
2. Render will start building automatically
3. Wait 2-5 minutes for first deployment

## ✅ **Expected Results**

### **Build Process:**
```bash
==> Installing dependencies
npm install
✅ Dependencies installed

==> Building application  
npm run build
✅ TypeScript compilation successful

==> Starting application
npm start
✅ Wakili Pro Backend running on 0.0.0.0:10000
```

### **Health Check:**
- **URL**: `https://your-service-name.onrender.com/health`
- **Response**: 
```json
{
  "status": "OK",
  "message": "Wakili Pro Backend is running",
  "timestamp": "2025-11-09T...",
  "version": "1.0.0"
}
```

## 🎯 **Advantages of Render vs Railway**

### **Why Render Usually Works:**
- ✅ **Better Node.js Support** - Handles TypeScript builds reliably
- ✅ **Clearer Logs** - Easy to debug if issues occur
- ✅ **Automatic SSL** - HTTPS certificates included
- ✅ **Health Checks** - Built-in monitoring
- ✅ **Free Tier** - No credit card required for basic usage

### **Expected Deployment URL:**
Your backend will be available at something like:
- `https://wakili-pro-backend-xyz123.onrender.com`

## 🔄 **After Render Deployment**

### **Step 1: Test Endpoints**
```bash
# Health check
curl https://your-render-url.onrender.com/health

# API root
curl https://your-render-url.onrender.com/api

# Mock auth
curl -X POST https://your-render-url.onrender.com/api/auth/login
```

### **Step 2: Update Frontend**
Update `frontend/.env.production`:
```bash
VITE_API_URL=https://your-render-url.onrender.com/api
```

### **Step 3: Deploy Frontend to Vercel**
Once backend is working on Render:
1. Deploy frontend to Vercel
2. Full-stack application will be live
3. Test end-to-end functionality

## 🆘 **If Issues Occur**

### **Check Render Logs:**
1. Go to your service dashboard
2. Click "Logs" tab  
3. Look for error messages during build or runtime

### **Common Issues & Solutions:**
- **Build fails**: Check if `npm install` succeeds
- **Start fails**: Verify `dist/index.js` exists after build
- **Port binding**: Our code now binds to `0.0.0.0` correctly
- **Health check fails**: Check if `/health` endpoint responds

---

## 🎉 **Ready to Deploy!**

**Next Action**: 
1. Go to https://render.com
2. Follow the steps above
3. Share the Render URL once deployed
4. We'll then deploy the frontend and complete the full-stack setup

**This should work much more reliably than Railway!** 🚀