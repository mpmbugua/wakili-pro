#!/bin/bash
# Render build script for frontend only

echo "Building Wakili Pro Frontend..."
cd frontend || exit 1
npm install --legacy-peer-deps
npm run build
echo "Frontend build complete!"
