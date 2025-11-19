#!/usr/bin/env bash
set -e

echo "Installing dependencies..."
npm ci

echo "Building shared package..."
cd shared
npm run build
cd ..

echo "Building backend..."
cd backend
npm run build
cd ..

echo "Build complete!"
