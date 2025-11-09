#!/bin/bash
# Railway build script to ensure proper TypeScript compilation

echo "Starting Railway build process..."

# Install dependencies
echo "Installing dependencies..."
npm ci --omit=dev

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "Building TypeScript..."
npm run build

# Verify build output
echo "Verifying build output..."
if [ -f "dist/index.js" ]; then
    echo "✅ Build successful - dist/index.js exists"
    ls -la dist/
else
    echo "❌ Build failed - dist/index.js not found"
    exit 1
fi

echo "Build process completed!"