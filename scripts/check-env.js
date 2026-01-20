import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetEnv = process.argv[2];
if (!targetEnv || !['production', 'development'].includes(targetEnv)) {
    console.error('Usage: node scripts/check-env.js <production|development>');
    process.exit(1);
}

const DIST_DIR = path.join(__dirname, '..', 'dist');

// Define backend URLs as strings to search for
const ENV_CONFIGS = {
    production: {
        expected: '/api',
        forbidden: 'olybars-backend-'
    },
    development: {
        expected: '/api',
        forbidden: 'olybars-backend-'
    }
};

const config = ENV_CONFIGS[targetEnv];

function checkFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            checkFiles(fullPath);
        } else if (file.endsWith('.js') || file.endsWith('.html')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(config.forbidden)) {
                console.error(`ERROR: Found environment mismatch in ${file}!`);
                console.error(`Target: ${targetEnv}`);
                console.error(`Forbidden Backend URL found: ${config.forbidden}`);
                process.exit(1);
            }
            if (!content.includes(config.expected) && file.includes('index')) {
                // Warning only because some chunks might not have it, but index should
                console.warn(`Warning: Potential issue in ${file} - Expected backend URL not found.`);
            }
        }
    }
}

console.log(`Checking build for ${targetEnv} safety...`);
if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: dist directory does not exist. Run build first.');
    process.exit(1);
}

checkFiles(DIST_DIR);
console.log(`Build verified for ${targetEnv}! ✅`);
