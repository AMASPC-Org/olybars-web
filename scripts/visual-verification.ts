import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

// Force home directory for Playwright
if (process.platform === 'win32' && !process.env.HOME) {
  process.env.HOME = process.env.USERPROFILE;
}

const TARGET_URL = 'https://ama-ecosystem-dev-9ceda.web.app/';
const OUTPUT_DIR = path.resolve(process.cwd(), 'verification-artifacts');
const SCREENSHOT_PATH = path.join(OUTPUT_DIR, 'dev-environment-capture.png');
const LOG_PATH = path.join(OUTPUT_DIR, 'browser-console.log');

async function verifyVisual() {
  console.log('📸 Starting Visual Verification Script (HYDRATION AWARE)...');
  console.log(`Target: ${TARGET_URL}`);

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const logs: string[] = [];
  const log = (msg: string) => {
    console.log(msg);
    logs.push(msg);
  };

  try {
    page.on('console', msg => {
      const entry = `[browser-${msg.type()}] ${msg.text()}`;
      log(entry);
    });

    page.on('request', request => {
      log(`[request] ${request.method()} ${request.url()}`);
    });

    page.on('response', async response => {
      const url = response.url();
      if (url.includes('/api/')) {
        try {
          const body = await response.text();
          log(`[data] ${url} response (${response.status()}): ${body.substring(0, 100)}...`);
        } catch (e) {
          log(`[data] ${url} response (${response.status()}) body unreadable`);
        }
      }
      if (response.status() >= 400) {
        log(`[error] ${response.status()} ${url}`);
      }
    });

    log(`🌐 Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 60000 });

    log('⏳ Waiting for #root to ensure React is mounted...');
    await page.waitForSelector('#root', { timeout: 10000 });

    log('⏳ Waiting 5 seconds for hydration and data population...');
    await page.waitForTimeout(5000);

    const ageGateButton = page.locator('button:has-text("I AM 21+ & AGREE")');
    if (await ageGateButton.isVisible()) {
      log('🔞 Age Gate detected. Clicking to bypass...');
      await ageGateButton.click();
      await page.waitForTimeout(2000);
    }

    const title = await page.title();
    log(`Page Title: ${title}`);

    const olyBarsTitle = page.getByText(/OlyBars/i);
    const hasOlyBars = await olyBarsTitle.first().isVisible();
    const venueCards = page.locator('div[class*="venue"], a[href*="/bars/"]');
    const venueCount = await venueCards.count();

    log('Visual Elements Check:');
    log(`- Root Element: ✅ Found`);
    log(`- "OlyBars" Text: ${hasOlyBars ? '✅ Found' : '❌ Missing'}`);
    log(`- Venue Cards: ${venueCount > 0 ? `✅ Found ${venueCount}` : '❌ Missing (Data failure?)'}`);

    log(`📸 Capturing screenshot to: ${SCREENSHOT_PATH}`);
    await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });

    log('✅ Verification Complete.');
  } catch (error: any) {
    log(`❌ Verification Failed: ${error.message}`);
    process.exit(1);
  } finally {
    const terminalOutput = logs.join('\n');
    fs.writeFileSync(LOG_PATH, terminalOutput);

    const dataLogs = logs.filter(l => l.includes('[data]') || l.includes('[error]'));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'network-debug.log'), dataLogs.join('\n'));

    console.log(`📄 Logs saved to: ${LOG_PATH}`);
    await browser.close();
  }
}

verifyVisual();
