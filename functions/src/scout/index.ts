import { onSchedule } from "firebase-functions/v2/scheduler";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import * as admin from "firebase-admin";
import { PubSub } from "@google-cloud/pubsub";
import puppeteer from "puppeteer";
import robotsParser from "robots-parser";
import md5 from "md5";
import { GeminiService } from "../services/geminiService";
// Import shared types
import { Venue, ScraperSource } from "../types/venue";

const db = admin.firestore();
const pubsub = new PubSub();
const TOPIC_NAME = "venue-scrape-queue";

// --- DISPATCHER ---

export const scoutDispatcher = onSchedule(
  {
    schedule: "every wed,fri 09:00", // Keeps legacy schedule, but effectively acts as a safety net for "stale" items
    timeZone: "America/Los_Angeles",
    retryCount: 3,
    memory: "512MiB",
  },
  async (event) => {
    console.log("🚀 [Dispatcher] Starting scout dispatch run...");

    // Query for venues with scraping enabled
    const venuesSnap = await db
      .collection("venues")
      .where("is_scraping_enabled", "==", true)
      .get();

    console.log(
      `[Dispatcher] Found ${venuesSnap.size} venues with scraping enabled.`,
    );

    const batchPublisher = pubsub.topic(TOPIC_NAME);
    const publishPromises: Promise<any>[] = [];
    const now = Date.now();
    const STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 Hours

    for (const doc of venuesSnap.docs) {
      const venue = doc.data() as Venue;
      if (!venue.scraper_config) continue;

      for (const source of venue.scraper_config) {
        // FILTER: Only Active Sources
        if (!source.isEnabled) continue;

        // FILTER: Only Sources that are Stale or have never been run
        // NOTE: We do NOT pick up 'pending' items here. Realtime triggers handle those.
        // We mainly want to catch 'active' items that haven't updated in a while.
        // Also retry 'error' items if they are old enough (backoff)? For now, let's stick to active/stale.

        const lastRun = source.lastScraped || 0;
        const isStale = now - lastRun > STALE_THRESHOLD;

        // Also pick up if it's 'active' but somehow missed a run (e.g. manual toggle on but no trigger fired?)
        // Just strictly using STALE check for now to avoid thundering herd on every run.

        if (isStale && source.status !== "pending") {
          const messageData = {
            venueId: venue.id,
            sourceId: source.id,
            url: source.url,
            previousHash: source.contentHash || "",
          };
          const dataBuffer = Buffer.from(JSON.stringify(messageData));
          publishPromises.push(
            batchPublisher.publishMessage({ data: dataBuffer }),
          );
        }
      }
    }

    await Promise.all(publishPromises);
    console.log(`[Dispatcher] Dispatched ${publishPromises.length} scouts.`);
  },
);

// --- WORKER ---

export const scoutWorker = onMessagePublished(
  {
    topic: TOPIC_NAME,
    timeoutSeconds: 300, // 5 min max
    memory: "2GiB", // Puppeteer needs RAM
    cpu: 1,
    secrets: [
      "GOOGLE_API_KEY",
      "GOOGLE_GENAI_API_KEY",
      "GOOGLE_BACKEND_KEY",
      "VITE_GOOGLE_BROWSER_KEY",
      "INTERNAL_HEALTH_TOKEN",
      "GOOGLE_MAPS_API_KEY",
    ],
  },
  async (event) => {
    const { venueId, sourceId, url, previousHash } = event.data.message.json;
    console.log(
      `🤖 [Worker] Scout allocated for ${venueId} source ${sourceId} (${url})`,
    );

    const venueRef = db.collection("venues").doc(venueId);

    // Step 1: Pre-Flight Checks (Read-only first to save writes)
    // Actually, we need to read the config to check robots cache and status before launching browser
    // But since we need to update status eventually, we'll do a transactional flow or optimistic locking?
    // Firestore transactions are good but Puppeteer is slow. DON'T put Puppeteer inside a transaction.
    // Pattern:
    // 1. Fetch Venue.
    // 2. Validate Source exists & rules.
    // 3. Scrape (Outside Transaction).
    // 4. Update Venue (Transaction/Merge).

    const venueDoc = await venueRef.get();
    if (!venueDoc.exists) return;
    const venueData = venueDoc.data() as Venue;

    if (venueData.is_manually_blocked) {
      console.warn(`[Worker] Venue ${venueId} blocked.`);
      return;
    }

    const source = venueData.scraper_config?.find(
      (s: ScraperSource) => s.id === sourceId,
    );
    if (!source) {
      console.warn(`[Worker] Source ${sourceId} not found on venue.`);
      return;
    }

    // Robots Check (Politeness)
    // If we have a cached verdict < 7 days old, verify it
    const now = Date.now();
    const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

    // Default Allow
    let canScrape = true;
    let newRobotsCache = source.robotsCache;

    // Check if we need to refresh robots.txt
    const cacheAge = now - (source.robotsCache?.checkedAt || 0);
    const needsRefresh = !source.robotsCache || cacheAge > CACHE_TTL;

    if (needsRefresh) {
      try {
        const robotsUrl = new URL("/robots.txt", url).href;
        const resp = await fetch(robotsUrl);
        if (resp.ok) {
          const txt = await resp.text();
          const robots = robotsParser(robotsUrl, txt);
          if (robots.isDisallowed(url, "OlyBarsBot")) {
            console.warn(`[Worker] Robots.txt disallows OlyBarsBot.`);
            canScrape = false;
            newRobotsCache = { verdict: "disallow", checkedAt: now };
          } else {
            newRobotsCache = { verdict: "allow", checkedAt: now };
          }
        } else {
          // Fail Open if robots.txt 404s
          newRobotsCache = { verdict: "allow", checkedAt: now };
        }
      } catch (e) {
        // Fail Open on Network Error (assuming site is up but robots.txt unreachable)
        newRobotsCache = { verdict: "allow", checkedAt: now };
      }
    } else if (source.robotsCache?.verdict === "disallow") {
      canScrape = false;
    }

    if (!canScrape) {
      await updateSourceStatus(
        venueRef,
        sourceId,
        "error",
        "Blocked by robots.txt",
        undefined,
        newRobotsCache,
      );
      return;
    }

    // Step 2: The Scout (Puppeteer)
    let browser;
    let currentHash = "";
    let rawText = "";
    let scrapeError: string | undefined;

    try {
      browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (Compatible; OlyBarsBot/1.0; +https://olybars.com/bot)",
      );

      // Racing navigation against timeout
      await Promise.race([
        page.goto(url, { waitUntil: "networkidle2", timeout: 30000 }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Navigation Timeout")), 30000),
        ),
      ]);

      rawText = await page.evaluate(() => document.body.innerText);
      currentHash = md5(rawText);

      if (currentHash === previousHash) {
        console.log(
          `[Worker] Content unchanged (${currentHash}). Updating timestamp only.`,
        );
        await updateSourceStatus(
          venueRef,
          sourceId,
          "active",
          undefined,
          currentHash,
          newRobotsCache,
        );
        return;
      }
    } catch (e: any) {
      console.error(`[Worker] Scrape Failed: ${e.message}`);
      scrapeError = e.message;
      // Don't return yet, we need to update status
    } finally {
      if (browser) await browser.close();
    }

    if (scrapeError) {
      const failures = (source.consecutiveFailures || 0) + 1;
      // Backoff? For now just log failure.
      // If failures > 5, maybe disable? keeping it simple for now.
      await updateSourceStatus(
        venueRef,
        sourceId,
        "error",
        scrapeError,
        undefined,
        newRobotsCache,
        failures,
      );
      return;
    }

    // Step 3: The Brain (Gemini)
    try {
      const gemini = new GeminiService();

      // Context Prep
      let city = "Olympia, WA"; // Default
      if (venueData?.address) {
        const parts = venueData.address.split(",");
        if (parts.length >= 3) {
          const cityPart = parts[1].trim();
          const stateZipPart = parts[2].trim().split(" ")[0];
          city = `${cityPart}, ${stateZipPart}`;
        }
      }

      const venueContext = { city, timezone: "America/Los_Angeles" };
      const todayPST = new Date().toLocaleDateString("en-US", {
        timeZone: "America/Los_Angeles",
      });

      // Analyze
      // Note: Using 'EVENTS' as default target type for now, but source.target should drive this
      const targetType = source.target || "EVENTS";
      // Only run analysis if it's an event or menu scrape?
      // Logic supports EVENTS, MENU, NEWSLETTER.

      // We map explicit target types to what GeminiService expects
      let geminiTarget: "EVENTS" | "MENU" | "NEWSLETTER" | "SOCIAL_FEED" =
        "EVENTS";
      if (targetType === "MENU") geminiTarget = "MENU";
      if (targetType === "NEWSLETTER") geminiTarget = "NEWSLETTER";

      const extractedData = await gemini.analyzeScrapedContent(
        rawText,
        todayPST,
        venueContext,
        geminiTarget,
      );

      // Step 4: The Scribe (Save Results)
      if (extractedData) {
        const batch = db.batch();

        if (geminiTarget === "EVENTS" && Array.isArray(extractedData)) {
          console.log(`[Worker] Saving ${extractedData.length} events.`);
          for (const ev of extractedData) {
            const titleSlug = ev.title.toLowerCase().replace(/[^a-z0-9]/g, "");
            const eventId = `${venueId}_${ev.date.replace(/-/g, "")}_${titleSlug}`;
            const eventRef = db.collection("league_events").doc(eventId);
            batch.set(
              eventRef,
              {
                ...ev,
                venueId,
                source: "automation",
                lastScraped: Date.now(),
                pointsAwarded: 25,
              },
              { merge: true },
            );
          }
        }
        // Handle other types later (Menu/Newsletter updates to venue doc?)

        await batch.commit();
      }

      // Success Update
      await updateSourceStatus(
        venueRef,
        sourceId,
        "active",
        undefined,
        currentHash,
        newRobotsCache,
        0,
      );
    } catch (e: any) {
      console.error(`[Worker] Analysis Failed: ${e.message}`);
      await updateSourceStatus(
        venueRef,
        sourceId,
        "error",
        `Analysis Failed: ${e.message}`,
        currentHash,
        newRobotsCache,
      );
    }
  },
);

// Helper to reliably update a specific item in the array
async function updateSourceStatus(
  venueRef: FirebaseFirestore.DocumentReference,
  sourceId: string,
  status: "active" | "error" | "pending",
  errorMsg?: string,
  contentHash?: string,
  robotsCache?: { verdict: "allow" | "disallow"; checkedAt: number },
  consecutiveFailures: number = 0,
) {
  await db.runTransaction(async (t) => {
    const doc = await t.get(venueRef);
    if (!doc.exists) return;
    const data = doc.data() as Venue;

    if (!data.scraper_config) return;

    const idx = data.scraper_config.findIndex(
      (s: ScraperSource) => s.id === sourceId,
    );
    if (idx === -1) return;

    const sources = [...data.scraper_config];
    sources[idx] = {
      ...sources[idx],
      status,
      lastScraped: Date.now(),
      errorMsg: errorMsg || undefined, // Clear if undefined
      consecutiveFailures, // Reset or Increment
      ...(contentHash ? { contentHash } : {}),
      ...(robotsCache ? { robotsCache } : {}),
    };

    t.update(venueRef, { scraper_config: sources });
  });
}
