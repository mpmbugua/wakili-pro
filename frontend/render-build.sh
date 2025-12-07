#!/bin/bash
# Render build script for frontend only
# CACHE BUSTER: 2025-12-07-16:30:00-UTC

echo "Building Wakili Pro Frontend..."
echo "Build timestamp: $(date)"
echo "Force rebuild: $(date +%s)"
echo "Cache buster active - clean build"
cd frontend || exit 1

# Clear any existing build artifacts
echo "Cleaning old build artifacts..."
rm -rf dist node_modules/.vite

npm install --legacy-peer-deps
npm run build

# Copy _redirects and _headers files for SPA routing
echo "Copying _redirects and _headers for SPA routing..."
cp public/_redirects dist/_redirects 2>/dev/null || echo "Warning: _redirects not found"
cp public/_headers dist/_headers 2>/dev/null || echo "Warning: _headers not found"
cp public/404.html dist/404.html 2>/dev/null || echo "Warning: 404.html not found"

# Create fallback _redirects if it doesn't exist
if [ ! -f dist/_redirects ]; then
  echo "Creating _redirects file..."
  echo "/*    /index.html   200" > dist/_redirects
fi

# Verify _redirects exists and show content
if [ -f dist/_redirects ]; then
  echo "_redirects file verified:"
  cat dist/_redirects
else
  echo "ERROR: _redirects file missing!"
  exit 1
fi

echo "Frontend build complete!"
ls -la dist/