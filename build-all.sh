#!/bin/bash
set -e

echo "🔨 Starting full build process..."

# Build shared package first
echo "📦 Building shared package..."
cd shared
npm install
npm run build
cd ..

# Build frontend
echo "🎨 Building frontend..."
cd frontend
npm install
export VITE_API_URL=/api
export VITE_API_BASE_URL=/api
export VITE_WEBSOCKET_URL=""
npm run build
cd ..

# Build backend
echo "⚙️  Building backend..."
cd backend
npm install
npm run build
cd ..

echo "✅ Build complete!"
