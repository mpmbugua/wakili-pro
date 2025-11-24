#!/bin/bash
# Render build script for frontend only

echo "Building Wakili Pro Frontend..."
cd frontend || exit 1
npm install --legacy-peer-deps
npm run build

# Copy _redirects file for SPA routing
echo "Copying _redirects for SPA routing..."
cp public/_redirects dist/_redirects

echo "Frontend build complete!"
