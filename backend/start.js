#!/usr/bin/env node

// Startup wrapper to ensure correct working directory
const path = require('path');
const fs = require('fs');

// Determine correct path to index.js
const possiblePaths = [
  path.join(__dirname, 'dist', 'index.js'),           // Normal: backend/dist/index.js
  path.join(__dirname, '..', 'backend', 'dist', 'index.js'), // If running from root
  path.join(process.cwd(), 'dist', 'index.js'),       // Using current working dir
  path.join(process.cwd(), 'backend', 'dist', 'index.js')   // From project root
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
