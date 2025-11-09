#!/bin/bash

# Wakili Pro - Cloud Deployment Preparation Script
# Run this before deploying to cloud

echo "🚀 Wakili Pro - Cloud Deployment Preparation"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the Wakili Pro root directory"
    exit 1
fi

echo "✅ Directory check passed"

# Build verification
echo "🔨 Building all packages..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Please fix errors before deploying"
    exit 1
fi

echo "✅ All builds successful"

# Verify environment files
echo "🔧 Checking environment configurations..."

if [ -f "frontend/.env.production" ]; then
    echo "✅ Frontend production environment file exists"
else
    echo "❌ Missing frontend/.env.production"
    exit 1
fi

if [ -f "backend/.env.railway" ]; then
    echo "✅ Backend Railway environment file exists"
else
    echo "❌ Missing backend/.env.railway"
    exit 1
fi

# Check for required files
echo "📁 Verifying deployment files..."

if [ -f "frontend/vercel.json" ]; then
    echo "✅ Vercel configuration exists"
else
    echo "❌ Missing frontend/vercel.json"
    exit 1
fi

if [ -f "backend/railway.json" ]; then
    echo "✅ Railway configuration exists"
else
    echo "❌ Missing backend/railway.json"
    exit 1
fi

echo ""
echo "🎉 READY FOR CLOUD DEPLOYMENT!"
echo "==============================="
echo ""
echo "📋 Next Steps:"
echo "1. Push to GitHub repository"
echo "2. Deploy backend to Railway (with PostgreSQL)"
echo "3. Deploy frontend to Vercel"
echo "4. Update cross-origin URLs"
echo "5. Test all functionality"
echo ""
echo "📚 See CLOUD_DEPLOYMENT.md for detailed instructions"
echo ""
echo "🚀 Your Wakili Pro application is ready to go live!"