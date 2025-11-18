#!/usr/bin/env node

// Automated startup troubleshooting for Wakili Pro
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkEnvFile(dir, requiredVars = []) {
  const envPath = path.join(dir, '.env');
  if (!fs.existsSync(envPath)) {
    console.log(`❌ Missing .env in ${dir}`);
    return false;
  }
  const envContent = fs.readFileSync(envPath, 'utf-8');
  let allPresent = true;
  for (const v of requiredVars) {
    if (!envContent.includes(v)) {
      console.log(`❌ Missing ${v} in ${envPath}`);
      allPresent = false;
    }
  }
  if (allPresent) console.log(`✅ .env in ${dir} looks OK.`);
  return allPresent;
}

function checkPort(port) {
  try {
    const result = execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe' }).toString();
    if (result && result.includes(`:${port}`)) {
      console.log(`❌ Port ${port} is in use.`);
      return false;
    }
    console.log(`✅ Port ${port} is free.`);
    return true;
  } catch {
    console.log(`✅ Port ${port} is free.`);
    return true;
  }
}

function tryNpmScript(dir, script) {
  try {
    console.log(`\n▶ Running '${script}' in ${dir}...`);
    const result = spawnSync('npm', ['run', script], { cwd: dir, stdio: 'inherit', shell: true });
    if (result.status === 0) {
      console.log(`✅ '${script}' ran successfully in ${dir}.`);
      return true;
    } else {
      console.log(`❌ '${script}' failed in ${dir}.`);
      return false;
    }
  } catch (e) {
    console.log(`❌ Error running '${script}' in ${dir}:`, e.message);
    return false;
  }
}

function main() {
  // 1. Check .env files
  checkEnvFile('backend', ['DATABASE_URL']);
  checkEnvFile('frontend', ['VITE_API_BASE_URL']);

  // 2. Check ports
  checkPort(5000);
  checkPort(3000);

  // 3. Test DB connection (backend)
  try {
    console.log('\n▶ Testing backend DB connection...');
    const result = spawnSync('npm', ['run', 'dev'], { cwd: 'backend', stdio: 'pipe', shell: true, timeout: 10000 });
    if (result.stdout && result.stdout.toString().includes('Database connection successful')) {
      console.log('✅ Backend DB connection successful.');
    } else {
      console.log('⚠️  Could not confirm backend DB connection. Check backend logs.');
    }
  } catch (e) {
    console.log('❌ Error testing backend DB connection:', e.message);
  }

  // 4. Try backend and frontend dev scripts
  tryNpmScript('backend', 'dev');
  tryNpmScript('frontend', 'dev');

  // 5. Suggest next steps
  console.log('\nIf any ❌ or ⚠️  above, check logs or .env files.');
}

main();
