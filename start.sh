#!/usr/bin/env bash
set -e

echo "Starting backend server..."
cd backend
node dist/index.js
