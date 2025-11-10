# 🔧 Render.com - Actual Deployment Steps

## 📋 **Updated Step-by-Step for Render Interface**

### **Step 1: Create Web Service**
1. Go to https://render.com
2. Sign up/Login with GitHub
3. Click **"New +"** → **"Web Service"**

### **Step 2: Connect Repository**
1. **"Build and deploy from a Git repository"**
2. Connect GitHub account
3. Find: `mpmbugua/wakili-pro`
4. Click **"Connect"**

### **Step 3: Configure Service** 
**Basic Info:**
- **Name**: `wakili-pro-backend`
- **Region**: Choose your preferred region
- **Branch**: `main`
- **Root Directory**: `backend` (IMPORTANT!)

### **Step 4: Environment & Build Settings**

**If you see these fields:**
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

**If you DON'T see Build/Start Command fields:**
Render will auto-detect from `package.json`. Our current package.json should work:
```json
{
  "scripts": {
    "build": "tsc --skipLibCheck",
    "start": "node dist/index.js"
  }
}
```

### **Step 5: Advanced Settings (if available)**
- **Auto-Deploy**: ✅ Enable
- **Health Check Path**: `/health`
- **Instance Type**: Free tier

## 🛠️ **Alternative: Create render.yaml**

If Render isn't detecting the build commands properly, let me create a proper `render.yaml` file:
