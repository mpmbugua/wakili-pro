#!/bin/bash
# Render build script for frontend only

echo "Building Wakili Pro Frontend..."
echo "Build timestamp: $(date)"
echo "Force rebuild: $(date +%s)"
cd frontend || exit 1
npm install --legacy-peer-deps
npm run build

# Copy _redirects and _headers files for SPA routing
echo "Copying _redirects and _headers for SPA routing..."
cp public/_redirects dist/_redirects 2>/dev/null || echo "Warning: _redirects not found"
cp public/_headers dist/_headers 2>/dev/null || echo "Warning: _headers not found"

# Create fallback _redirects if it doesn't exist
if [ ! -f dist/_redirects ]; then
  echo "Creating _redirects file..."
  echo "/*    /index.html   200" > dist/_redirects
fi

echo "Frontend build complete!"
ls -la dist/