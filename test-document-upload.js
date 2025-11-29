#!/usr/bin/env node
/**
 * Test script for document upload functionality
 * Tests both local and production endpoints
 */

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const TEST_FILE = process.env.TEST_FILE || path.join(__dirname, 'test-document.pdf');

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

async function testHealthEndpoint() {
  try {
    log.info('Testing health endpoint...');
    const response = await axios.get(`${BACKEND_URL}/health`, { timeout: 5000 });
    
    if (response.data.status === 'OK') {
      log.success(`Server is healthy: ${response.data.message}`);
      return true;
    } else {
      log.error('Server returned non-OK status');
      return false;
    }
  } catch (error) {
    log.error(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testDocumentUploadEndpoint(token) {
  try {
    log.info('Testing document upload endpoint...');
    
    // Create a test PDF file if it doesn't exist
    if (!fs.existsSync(TEST_FILE)) {
      log.warn('Test file not found, creating dummy PDF...');
      const testContent = '%PDF-1.4\n%Test Document\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n190\n%%EOF';
      fs.writeFileSync(TEST_FILE, testContent);
    }

    const formData = new FormData();
    formData.append('document', fs.createReadStream(TEST_FILE));
    formData.append('title', 'Test Document Upload');
    formData.append('type', 'CONTRACT');
    formData.append('category', 'Test');

    const response = await axios.post(
      `${BACKEND_URL}/api/user-documents/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${token}`
        },
        timeout: 30000
      }
    );

    if (response.data.success) {
      log.success('Document uploaded successfully!');
      log.info(`File URL: ${response.data.data?.fileUrl || 'N/A'}`);
      log.info(`Document ID: ${response.data.data?.id || 'N/A'}`);
      return true;
    } else {
      log.error('Upload failed: ' + response.data.message);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 401) {
      log.error('Authentication required. Please provide a valid JWT token.');
      log.info('Set TOKEN environment variable: TOKEN="your-jwt-token" node test-document-upload.js');
    } else {
      log.error(`Upload test failed: ${error.message}`);
      if (error.response?.data) {
        console.log('Response:', error.response.data);
      }
    }
    return false;
  }
}

async function testCloudinaryConfig() {
  try {
    log.info('Checking Cloudinary configuration...');
    
    const hasCloudName = !!process.env.CLOUDINARY_CLOUD_NAME;
    const hasApiKey = !!process.env.CLOUDINARY_API_KEY;
    const hasApiSecret = !!process.env.CLOUDINARY_API_SECRET;

    if (hasCloudName && hasApiKey && hasApiSecret) {
      log.success('Cloudinary credentials are configured');
      log.info(`Cloud Name: ${process.env.CLOUDINARY_CLOUD_NAME}`);
      return true;
    } else {
      log.warn('Cloudinary credentials missing in environment');
      log.info('Required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
      return false;
    }
  } catch (error) {
    log.error(`Config check failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('\n=== Document Upload Test Suite ===\n');
  console.log(`Backend URL: ${BACKEND_URL}\n`);

  // Test 1: Health check
  const healthOk = await testHealthEndpoint();
  if (!healthOk) {
    log.error('Server is not responding. Aborting tests.');
    process.exit(1);
  }
  console.log('');

  // Test 2: Cloudinary config
  await testCloudinaryConfig();
  console.log('');

  // Test 3: Document upload (requires auth token)
  const token = process.env.TOKEN;
  if (token) {
    await testDocumentUploadEndpoint(token);
  } else {
    log.warn('Skipping upload test - no auth token provided');
    log.info('To test upload, set TOKEN environment variable');
    log.info('Example: TOKEN="eyJhbGc..." node test-document-upload.js');
  }

  console.log('\n=== Tests Complete ===\n');
}

// Run tests
runTests().catch(error => {
  log.error(`Fatal error: ${error.message}`);
  process.exit(1);
});
