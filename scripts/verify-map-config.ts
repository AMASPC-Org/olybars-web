
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load secrets
// Use process.cwd() to be safe in ESM/TSX context when running from root
const envPath = path.resolve(process.cwd(), 'secrets/development.env');

if (!fs.existsSync(envPath)) {
  console.error(`❌ secrets/development.env not found at: ${envPath}`);
  process.exit(1);
}

dotenv.config({ path: envPath });

const browserKey = process.env.VITE_GOOGLE_BROWSER_KEY;
const backendKey = process.env.GOOGLE_BACKEND_KEY;

console.log('\n🗺️  MAP CONFIGURATION VERIFICATION 🗺️');
console.log('=======================================');

if (!browserKey) {
  console.error('❌ VITE_GOOGLE_BROWSER_KEY is missing');
} else {
  console.log(`✅ VITE_GOOGLE_BROWSER_KEY found: ${browserKey.substring(0, 5)}...${browserKey.substring(browserKey.length - 5)}`);
  if (!browserKey.includes('AIza')) {
    console.warn('⚠️  Key does not look like a standard Google API Key (starts with AIza...)');
  }
}

if (!backendKey) {
  console.error('❌ GOOGLE_BACKEND_KEY is missing');
} else {
  console.log(`✅ GOOGLE_BACKEND_KEY found: ${backendKey.substring(0, 5)}...${backendKey.substring(backendKey.length - 5)}`);
}

console.log('\n👉 MANUAL ACTION REQUIRED IN GOOGLE CLOUD CONSOLE:');
console.log('1. Go to APIs & Services > Credentials');
console.log(`2. Find the key ending in ...${browserKey?.substring(browserKey.length - 4)}`);
console.log('3. Ensure "Maps JavaScript API" is checked in API Restrictions');
console.log('4. Ensure "Places API" is checked in API Restrictions');
console.log('5. Ensure "HTTP Referrers" includes:');
console.log('   - http://localhost:3000/*');
console.log('   - https://olybars.com/* (or your domain)');
console.log('\n✅ Script Complete.');
