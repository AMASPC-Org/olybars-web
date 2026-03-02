import { chromium, Page } from 'playwright';
import path from 'path';
import fs from 'fs';

// --- CONFIGURATION ---
const BASE_URL = 'http://localhost:3000';
const HEADLESS = true; // Set to false to see the browser action
const OUTPUT_DIR = path.resolve(process.cwd(), 'audit-artifacts');

// --- ROUTE DEFINITIONS ---
const ROUTES = [
  // CORE NAVIGATION
  { path: '/', name: 'Home (Buzz)', type: 'core' },
  { path: '/bars', name: 'Directory (Bars)', type: 'core' },
  { path: '/map', name: 'Map Interface', type: 'core' },
  { path: '/events', name: 'Events HQ', type: 'core' },
  { path: '/league-hq', name: 'League HQ', type: 'core' },
  { path: '/glossary', name: 'Glossary (Marketing)', type: 'core' },

  // DYNAMIC CONTENT (Assumes Seeded Data)
  { path: '/bars/well-80', name: 'Venue: Well 80', type: 'dynamic' },
  { path: '/bars/three-magnets', name: 'Venue: Three Magnets', type: 'dynamic' },

  // EXPECTED HANDLING (Negative Tests)
  { path: '/bars/garbage-id-99999', name: 'Invalid Venue ID', type: '404' },

  // PROTECTED / COMPLEX
  { path: '/profile', name: 'User Profile (Unauth)', type: 'protected' },
];

async function checkServer() {
  try {
    const response = await fetch(BASE_URL);
    return response.ok;
  } catch (e) {
    return false;
  }
}

async function runAudit() {
  console.log('\n🕵️  --- STARTING NAVIGATION AUDIT (OlyBars) ---\n');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 0. HEALTH CHECK
  process.stdout.write('Checking LocalHost Connectivity... ');
  const isUp = await checkServer();
  if (!isUp) {
    console.log('❌ FAIL');
    console.error(`ERROR: Server not reachable at ${BASE_URL}. Ensure 'npm run dev' is active.`);
    process.exit(1);
  }
  console.log('✅ OK');

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext();
  const results: any[] = [];
  let crashCount = 0;

  for (const route of ROUTES) {
    const page = await context.newPage();
    const url = `${BASE_URL}${route.path}`;
    const result = {
      route: route.path,
      name: route.name,
      status: 'PENDING',
      issues: [] as string[]
    };

    console.log(`\n➡️  Auditing: ${route.name} (${route.path})`);

    // CAPTURE LOGS
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Filter out expected 404 network errors if we are testing 404
        if (route.type === '404') {
          const text = msg.text();
          if (text.includes('404') ||
            text.includes('Error in fetchVenueById') ||
            text.includes('Failed to fetch venue')) {
            return;
          }
        }
        result.issues.push(`[Console] ${msg.text()}`);
      }
    });

    page.on('pageerror', err => {
      result.issues.push(`[CRASH] ${err.message}`);
    });

    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // 1. HTTP Status Verification
      if (!response) {
        result.issues.push('Network: No response received');
      } else {
        const status = response.status();
        if (route.type === 'core' || route.type === 'dynamic') {
          if (status >= 400) result.issues.push(`HTTP Error: ${status}`);
        }
      }

      // 2. Hydration & Rendering
      await page.waitForTimeout(1000); // Give React 1s to mount/crash

      // 3. "BLUE SCREEN" CHECK (The "Spill in the Well" ErrorBoundary)
      const isBlueScreen = await page.getByText(/SPILL IN THE WELL/i).count() > 0;
      if (isBlueScreen) {
        result.issues.push('❌ FATAL: "Spill in the Well" Blue Screen Detected');
        crashCount++;
      } else {
        // If no blue screen, ensure we have a React root or expected 404 content
        const hasRoot = await page.locator('#root').count() > 0;

        if (route.type === '404') {
          // For 404 routes, we WANT to see "Not Found" or "404"
          const bodyText = await page.innerText('body');
          const isNotFound = /not found|404|nothing here/i.test(bodyText);
          if (!isNotFound) {
            result.issues.push('⚠️ Content: Expected 404 screen, got generic page.');
          }
        }
      }

    } catch (e: any) {
      result.issues.push(`nav_failed: ${e.message}`);
    }

    // REPORTING
    if (result.issues.length > 0) {
      result.status = 'FAIL';
      console.log(`   ❌ FAILED`);
      result.issues.forEach((issue: string) => console.log(`      - ${issue}`));

      // Screenshot Evidence
      const safeName = route.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      await page.screenshot({ path: path.join(OUTPUT_DIR, `FAIL_${safeName}.png`) });
    } else {
      result.status = 'PASS';
      console.log(`   ✅ PASS`);
    }

    results.push(result);
    await page.close();
  }

  await browser.close();

  // FINAL REPORT
  const failures = results.filter(r => r.status === 'FAIL');

  // WRITE REPORT
  const reportPath = path.join(OUTPUT_DIR, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify({ results, summary: { total: results.length, passed: results.length - failures.length, failed: failures.length, crashCount } }, null, 2));
  console.log(`📋 Report saved to ${reportPath}`);

  console.log('\n----------------------------------------');
  console.log(`📊 SUMMARY: ${results.length - failures.length}/${results.length} Pased`);
  if (failures.length > 0) {
    console.log(`🚨 CRITICAL ISSUES FOUND: ${crashCount} Blue Screens`);
    process.exit(1);
  } else {
    console.log('🎉 AUDIT CLEAN. No broken routes or crashes detected.');
    process.exit(0);
  }
}

runAudit();
