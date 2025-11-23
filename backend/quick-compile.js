// Quick compile script to update dist/index.js without full rebuild
const { execSync } = require('child_process');
const path = require('path');

console.log('🔨 Quick compiling backend/src/index.ts...');

try {
  // Compile just index.ts
  execSync(
    'npx tsc src/index.ts --outDir dist --skipLibCheck --esModuleInterop --module commonjs --target es2020 --moduleResolution node --allowJs true',
    { 
      cwd: __dirname,
      stdio: 'inherit'
    }
  );
  
  console.log('✅ Compilation complete! dist/index.js updated.');
  console.log('🚀 Run: npm run dev');
} catch (error) {
  console.error('❌ Compilation failed:', error.message);
  process.exit(1);
}
