// @ts-nocheck
import { db, storage } from "../firebaseAdmin.js";
import { ScraperService } from "./scraperService.js";
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
        // If 403/401, might need rendering or just fail.
        console.warn(`Static fetch failed ${res.status}, falling back to renderer if safe.`);
      } catch (e) {
        console.warn("Static fetch error", e);
      }
    }

    // Puppeteer Fallback
    // Note: In Cloud Run, launch needs args for sandbox
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });
    try {
      const page = await browser.newPage();
      await page.setUserAgent("OlyBars-Scraper/1.0 (PartnerBot; +https://olybars.com/bot)");
      await page.goto(validatedUrl, { waitUntil: 'networkidle2', timeout: 30000 });
      const content = await page.content();
      return content;
    } finally {
      await browser.close();
    }
  }

  static async executeRun(runId: string): Promise<void> {
    console.log(`Starting run ${runId}`);

    // 1. Mark Started
    await ScraperService.markRunStarted(runId);

    // 2. Load Run & Scraper
    const runDoc = await db.collection("scraper_runs").doc(runId).get();
    if (!runDoc.exists) throw new Error("Run not found");
    const run = runDoc.data() as ScraperRun;

    const scraper = await ScraperService.getScraper(run.scraperId);
    if (!scraper) {
      await ScraperService.markRunComplete(runId, RunStatus.enum.FAILED, undefined, "Scraper deleted or missing");
      return;
    }

    try {
      // 3. Fetch
      const html = await this.fetchContent(scraper.url);

      // 4. Hash & Diff
      const currentHash = contentHash(html);

      // Check previous run hash? 
      // We can query the LAST 'SUCCESS' run for this scraper.
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
          return;
        }
      }

      // 5. LLM Extraction (Stub - Replace with real call)
      // This is where we'd call Gemini 2.5 Flash
      // const extractedData = await extractWithGemini(html, scraper.type, scraper.extractionInstructions);
      const extractedData = {}; // Placeholder

      // 6. Save Data (Stub)
      // Save to 'events', 'menus' etc based on type.

      // 7. Save Artifacts
      const bucket = storage.bucket(); // Default bucket
      const artifactPath = `artifacts/${scraper.venueId}/${scraper.id}/${runId}.html`;
      await bucket.file(artifactPath).save(html);

      // 8. Success
      await ScraperService.markRunComplete(runId, RunStatus.enum.SUCCESS, {
        pagescanned: 1,
        itemsExtracted: 0,
        durationMs: 0
      });

      // Update Scraper last hash?
      // Optional, but run history has it.

    } catch (e: any) {
      console.error("Run failed", e);
      await ScraperService.markRunComplete(runId, RunStatus.enum.FAILED, undefined, e.message);
    }
  }
}
