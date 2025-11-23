// Simple test to see what error the backend is throwing
console.log('Starting backend test...');
console.log('Node version:', process.version);
console.log('Current directory:', process.cwd());

try {
  require('./dist/index.js');
  console.log('✅ Backend loaded successfully');
} catch (error) {
  console.error('❌ Backend error:');
  console.error(error);
  process.exit(1);
}
