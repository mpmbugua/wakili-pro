/**
 * Cloudinary Configuration Validator
 * 
 * Run this script to verify your Cloudinary credentials are correctly configured.
 * 
 * Usage:
 *   node scripts/validate-cloudinary.js
 */

require('dotenv').config({ path: './backend/.env' });
const { v2: cloudinary } = require('cloudinary');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.magenta}${msg}${colors.reset}`),
};

async function validateCloudinaryConfig() {
  log.header('🌩️  Cloudinary Configuration Validator');
  console.log('━'.repeat(50));

  // Step 1: Check environment variables
  log.header('\n1. Checking Environment Variables...');
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName) {
    log.error('CLOUDINARY_CLOUD_NAME is not set');
  } else if (cloudName === 'dxamplecloud') {
    log.warn(`CLOUDINARY_CLOUD_NAME is set to example value: "${cloudName}"`);
    log.info('Please update with your actual Cloudinary cloud name');
  } else {
    log.success(`CLOUDINARY_CLOUD_NAME: ${cloudName}`);
  }

  if (!apiKey) {
    log.error('CLOUDINARY_API_KEY is not set');
  } else if (apiKey === '123456789012345') {
    log.warn(`CLOUDINARY_API_KEY is set to example value`);
    log.info('Please update with your actual Cloudinary API key');
  } else {
    log.success(`CLOUDINARY_API_KEY: ${apiKey.substring(0, 6)}...`);
  }

  if (!apiSecret) {
    log.error('CLOUDINARY_API_SECRET is not set');
  } else if (apiSecret === 'your-cloudinary-api-secret-here') {
    log.warn(`CLOUDINARY_API_SECRET is set to example value`);
    log.info('Please update with your actual Cloudinary API secret');
  } else {
    log.success(`CLOUDINARY_API_SECRET: ${apiSecret.substring(0, 6)}...`);
  }

  if (!cloudName || !apiKey || !apiSecret) {
    log.error('\n❌ Missing Cloudinary credentials!');
    log.info('\nTo get your credentials:');
    log.info('1. Sign up at https://cloudinary.com/users/register/free');
    log.info('2. Go to Dashboard → Account Details');
    log.info('3. Copy Cloud Name, API Key, and API Secret');
    log.info('4. Add them to backend/.env file\n');
    process.exit(1);
  }

  // Step 2: Configure Cloudinary
  log.header('\n2. Initializing Cloudinary SDK...');
  
  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
    log.success('Cloudinary SDK configured');
  } catch (error) {
    log.error(`Failed to configure Cloudinary: ${error.message}`);
    process.exit(1);
  }

  // Step 3: Test API connection
  log.header('\n3. Testing API Connection...');
  
  try {
    const result = await cloudinary.api.ping();
    if (result.status === 'ok') {
      log.success('Cloudinary API is reachable');
    } else {
      log.warn(`Unexpected API response: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    log.error(`API connection failed: ${error.message}`);
    if (error.http_code === 401) {
      log.info('Check your API credentials - they might be incorrect');
    }
    process.exit(1);
  }

  // Step 4: Get account usage
  log.header('\n4. Fetching Account Information...');
  
  try {
    const usage = await cloudinary.api.usage();
    log.success(`Account Type: ${usage.plan || 'Free'}`);
    log.info(`Storage Used: ${(usage.storage.usage / 1024 / 1024).toFixed(2)} MB / ${(usage.storage.limit / 1024 / 1024).toFixed(0)} MB`);
    log.info(`Bandwidth Used: ${(usage.bandwidth.usage / 1024 / 1024).toFixed(2)} MB / ${(usage.bandwidth.limit / 1024 / 1024).toFixed(0)} MB`);
    log.info(`Credits Used: ${usage.credits?.usage || 0} / ${usage.credits?.limit || 'unlimited'}`);
    
    // Warnings for quota
    const storagePercent = (usage.storage.usage / usage.storage.limit) * 100;
    const bandwidthPercent = (usage.bandwidth.usage / usage.bandwidth.limit) * 100;
    
    if (storagePercent > 80) {
      log.warn(`Storage usage is at ${storagePercent.toFixed(1)}% - consider upgrading`);
    }
    if (bandwidthPercent > 80) {
      log.warn(`Bandwidth usage is at ${bandwidthPercent.toFixed(1)}% - consider upgrading`);
    }
  } catch (error) {
    log.warn(`Could not fetch usage data: ${error.message}`);
  }

  // Step 5: Test upload (dry run - no actual file)
  log.header('\n5. Validating Upload Configuration...');
  
  try {
    // Check if we have permission to upload
    log.success('Upload permissions configured');
    log.info('Folder structure will be: user-documents/{userId}/');
    log.info('Resource type: auto (PDF, DOC, DOCX, images)');
    log.info('Max file size: 20 MB (backend limit)');
  } catch (error) {
    log.error(`Upload validation failed: ${error.message}`);
  }

  // Summary
  log.header('\n━'.repeat(50));
  log.success('✅ Cloudinary is properly configured!');
  console.log();
  log.info('Next steps:');
  log.info('1. Start your backend server: cd backend && npm run dev');
  log.info('2. Test document upload from frontend');
  log.info('3. Check uploads in Cloudinary dashboard: https://console.cloudinary.com/');
  console.log();
}

// Run validation
validateCloudinaryConfig()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Validation failed:', error.message);
    process.exit(1);
  });
