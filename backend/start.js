#!/usr/bin/env node

// Startup wrapper to ensure correct working directory and run migrations
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('[Startup] Wakili Pro Backend Starting...');

// Run database migrations if in production
if (process.env.NODE_ENV === 'production') {
  console.log('[Startup] Running database migrations...');
  try {
    execSync('npx prisma migrate deploy', { 
      stdio: 'inherit',
      cwd: __dirname 
    });
    console.log('[Startup] Migrations completed successfully');
  } catch (error) {
    console.warn('[Startup] Migration failed, but continuing startup:', error.message);
    // Don't exit - server can still start without migrations if schema already matches
  }
}

// Determine correct path to index.js
const possiblePaths = [
  path.join(__dirname, 'dist', 'index.js'),                    // When running from backend/
  path.join(__dirname, 'index.js'),                            // When already in dist/
  path.join(process.cwd(), 'dist', 'index.js'),                // From backend/ with cwd
  path.join(process.cwd(), 'backend', 'dist', 'index.js'),     // From project root
  path.join(__dirname, '..', 'dist', 'index.js')               // If script is in subfolder
];

let indexPath = null;
for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    indexPath = p;
    console.log(`[Startup] Found index.js at: ${indexPath}`);
    break;
  }
}

if (!indexPath) {
  console.error('[Startup Error] Could not find backend/dist/index.js');
  console.error('Searched paths:', possiblePaths);
  console.error('Current directory:', process.cwd());
  console.error('Script directory:', __dirname);
  process.exit(1);
}

// Change to backend directory before starting
const backendDir = path.dirname(path.dirname(indexPath));
process.chdir(backendDir);
console.log(`[Startup] Changed working directory to: ${backendDir}`);

// Start the application
console.log('[Startup] Starting application...');
require(indexPath);
