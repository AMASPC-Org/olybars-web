// @ts-nocheck
import { db, storage } from "../firebaseAdmin.js";
import { ScraperService } from "./ScraperService.js";
import { Scraper, ScraperRun, RunStatus } from "../types/scraper.js";
import { validateUrl } from "../utils/urlGuard.js";
import { contentHash } from "../utils/hashing.js";
import puppeteer from "puppeteer";
import { GoogleGenerativeAI } from "@google/genai";
import { config } from "../appConfig/config.js";

// Initialize Gemini
// Assuming ADC or API Key. For this environment, let's try strict Vertex if compatible, or API Key.
// The package '@google/genai' is new. 
// Usage: const genai = new GoogleGenerativeAI({ apiKey: ... }); 
// Or for Vertex: 
// import { VertexAI } from "@google-cloud/vertexai";
// Let's use standard @google/genai if we have a key, or fallback to Vertex.
// Given 'server/package.json' has @genkit-ai/googleai and @google/genai.
// We'll stick to a simple fetch to Vertex API or usage of the library if configured.
// For now, I'll mock the LLM call structure to be filled or use a placeholder that calls the API.

export type RunResult =
  | { status: "SUCCESS" }
  | { status: "TERMINAL_ERROR", reason: string }
  | { status: "RETRYABLE_ERROR", reason: string, retryAfter?: number };

export class WorkerService {

  private static async fetchContent(url: string, renderRequired = false): Promise<string> {
    const validatedUrl = await validateUrl(url);

    if (!renderRequired) {
      try {
        const res = await fetch(validatedUrl, {
          headers: {
            "User-Agent": "OlyBars-Scraper/1.0 (PartnerBot; +https://olybars.com/bot)"
          }
        });
        if (res.ok) return await res.text();
        // If 403/401/429, might need rendering or just fail.
        if (res.status === 429) throw new Error("Rate Limited");
        console.warn(`Static fetch failed ${res.status}, falling back to renderer if safe.`);
      } catch (e: any) {
        if (e.message === "Rate Limited") throw e;
        console.warn("Static fetch error", e);
      }
    }

    // Puppeteer Fallback
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    try {
      const page = await browser.newPage();
      await page.setUserAgent("OlyBars-Scraper/1.0 (PartnerBot; +https://olybars.com/bot)");

      // REM-10: SSRF Protection via Interception
      await page.setRequestInterception(true);
      page.on('request', async (request) => {
        if (request.isNavigationRequest()) {
          try {
            const targetUrl = request.url();
            // Re-validate every navigation target (redirects)
            await validateUrl(targetUrl);
            request.continue();
          } catch (e) {
            console.error(`[Security] Blocked redirect/nav to ${request.url()}:`, e);
            request.abort('accessdenied');
          }
        } else {
          request.continue();
        }
      });

      await page.goto(validatedUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      const content = await page.content();
      return content;
    } finally {
      await browser.close();
    }
  }

  private static async checkRobotsTxt(urlStr: string): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // Simple naive check
      const u = new URL(urlStr);
      const robotsUrl = `${u.protocol}//${u.host}/robots.txt`;
      // short timeout
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(robotsUrl, { signal: controller.signal });
      clearTimeout(id);

      if (res.status !== 200) return { allowed: true };

      const text = await res.text();
      // Check for "User-agent: * Disallow: /"
      if (/User-agent:\s*\*\s*[\r\n]+Disallow:\s*\/\s*($|[\r\n])/.test(text)) {
        return { allowed: false, reason: "Blocked by User-agent: *" };
      }
      // Check for OlyBars
      if (/User-agent:\s*OlyBars-Scraper\s*[\r\n]+Disallow:\s*\/\s*($|[\r\n])/.test(text)) {
        return { allowed: false, reason: "Blocked by User-agent: OlyBars-Scraper" };
      }

      return { allowed: true };
    } catch (e) {
      // Fail open on network error for robots.txt? Or fail closed?
      // Standard is usually fail open if unreachable, unless DNS fails.
      // Let's fail open but log.
      console.warn(`[Robots] Failed to check ${urlStr}`, e);
      return { allowed: true };
    }
  }

  static async executeRun(runId: string, retryCount: number = 0): Promise<RunResult> {
    console.log(`Starting run ${runId} (Attempt ${retryCount + 1})`);

    // 1. Mark Started
    await ScraperService.markRunStarted(runId);

    try {
      // 2. Load Run & Scraper
      const runDoc = await db.collection("scraper_runs").doc(runId).get();
      if (!runDoc.exists) {
        return { status: "TERMINAL_ERROR", reason: "Run not found" };
      }
      const run = runDoc.data() as ScraperRun;

      const scraper = await ScraperService.getScraper(run.scraperId);
      if (!scraper) {
        await ScraperService.markRunComplete(runId, RunStatus.enum.FAILED, undefined, "Scraper deleted or missing");
        return { status: "TERMINAL_ERROR", reason: "Scraper missing" };
      }

      // 2b. Check Robots.txt (REM-13)
      // Only check periodically? No, check every run for compliance.
      const robots = await this.checkRobotsTxt(scraper.url);

      // Update Scraper status
      await ScraperService.updateScraper(scraper.venueId, scraper.id, {
        robotsStatus: {
          allowed: robots.allowed,
          lastCheckedAt: Date.now(),
          reason: robots.reason
        }
      });

      if (!robots.allowed) {
        await ScraperService.markRunComplete(runId, RunStatus.enum.BLOCKED, undefined, robots.reason);
        // Refund? If blocked by site, maybe not refund? Or yes, because we didn't scrape?
        // Policy: If blocked, the service didn't deliver value. Refund.
        await ScraperService.refundQuota(scraper.venueId, runId);
        return { status: "TERMINAL_ERROR", reason: robots.reason || "Robots.txt blocked" };
      }

      // 3. Fetch
      const html = await this.fetchContent(scraper.url);

      // 4. Hash & Diff
      const currentHash = contentHash(html);

      const lastRunSnap = await db.collection("scraper_runs")
        .where("scraperId", "==", scraper.id)
        .where("status", "==", RunStatus.enum.SUCCESS)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      if (!lastRunSnap.empty) {
        const lastRun = lastRunSnap.docs[0].data() as ScraperRun;
        if (lastRun.contentHash === currentHash) {
          await ScraperService.markRunComplete(runId, RunStatus.enum.NO_CHANGE, { durationMs: 0 });
          return { status: "SUCCESS" };
        }
      }

      // 5. LLM Extraction (Stub)
      const extractedData = {};

      // 7. Save Artifacts
      const bucket = storage.bucket();
      const artifactPath = `artifacts/${scraper.venueId}/${scraper.id}/${runId}.html`;
      await bucket.file(artifactPath).save(html);

      // 8. Success
      await ScraperService.markRunComplete(runId, RunStatus.enum.SUCCESS, {
        pagescanned: 1,
        itemsExtracted: 0,
        durationMs: 0
      });

      // Persist Hash (TODO: helper to just update hash if needed, currently markRunComplete doesn't take it)
      // For now we assume markRunComplete might need an overload or we update it separately.
      // But ScraperRun type now has contentHash.
      // Let's do a direct update for now to be safe.
      await db.collection("scraper_runs").doc(runId).update({ contentHash: currentHash });

      return { status: "SUCCESS" };

    } catch (e: any) {
      console.error("Run failed", e);

      // Classification Logic
      const isRateLimit = e.message?.includes("Rate Limited") || e.message?.includes("429") || e.message?.includes("Timeout");
      const isTransient = isRateLimit || e.message?.includes("network") || e.message?.includes("hanged");

      const maxAttempts = parseInt(process.env.CLOUD_TASKS_MAX_ATTEMPTS || "5");
      const isFinalAttempt = retryCount + 1 >= maxAttempts;

      if (isTransient && !isFinalAttempt) {
        // Mark as FAILED (interim) but return RETRYABLE so Cloud Tasks retries.
        // Actually, if we mark as FAILED, the UI shows FAILED.
        // Maybe we shouldn't mark as FAILED if we are asking for retry?
        // But we need to update 'last error'. 
        // Let's keep it 'STARTED' or 'Running' with error log? 
        // Or just FAILED. If Cloud Tasks retries, it calls executeRun again, which calls markRunStarted again.
        // So FAILED is fine as intermediate state.
        await ScraperService.markRunFailed(runId, e.message);
        return { status: "RETRYABLE_ERROR", reason: e.message, retryAfter: 60 };
      }

      // Terminal or Final Attempt
      await ScraperService.markRunFailed(runId, e.message);

      // REFUND if it was a system error (not user config error)
      // Assuming all caught exceptions here are system/runtime errors.
      // User config errors (e.g. invalid URL) are caught in validation step usually.
      // But fetch failure on valid URL => could be site down (System failure? Or target failure?)
      // REFUND if it was a system error (not user config error)
      if (run && run.venueId) {
        await ScraperService.refundQuota(run.venueId, runId);
      } else {
        console.warn(`[Quota] Could not refund run ${runId} - missing venueId context`);
        // Best effort fallback if runId follows convention
        if (runId.includes("_")) {
          await ScraperService.refundQuota(runId.split("_")[0], runId);
        }
      }

      // Wait, `ScraperService.refundQuota` takes venueId.
      // If I don't have venueId, I can't refund.
      // But `refundQuota` *could* lookup the run first to get venueId if I didn't pass it?
      // No, key construction `venueId_YYYYMM` needs venueId.
      // Run doc has venueId. runDoc.data().venueId.

      // I will assume I can't do perfect refund if I can't load the run doc.
      // But if I loaded the run doc, I should use it.

      return { status: "TERMINAL_ERROR", reason: e.message };
    }
  }
}
