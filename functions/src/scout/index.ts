import { onSchedule } from "firebase-functions/v2/scheduler";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import * as admin from "firebase-admin";
import { PubSub } from "@google-cloud/pubsub";
import puppeteer from "puppeteer";
import robotsParser from "robots-parser";
import md5 from "md5";
import { GeminiService } from "../services/geminiService";
// Import shared types
import { Venue, ScraperSource, PartnerTier } from "../types/venue";

const db = admin.firestore();
const pubsub = new PubSub();
const TOPIC_NAME = "venue-scrape-queue";

const ONE_DAY = 24 * 60 * 60 * 1000;
const ONE_WEEK = 7 * ONE_DAY;
const ONE_MONTH = 30 * ONE_DAY;

function getScrapeInterval(
  tier: PartnerTier | undefined,
  sourceFreq?: string,
): number {
  // 1. Minimums based on Tier (The Floor)
  let minInterval = ONE_DAY; // Default to Daily for paid tiers/unknown
  if (tier === PartnerTier.LOCAL) minInterval = ONE_WEEK; // Local is weekly max

  // 2. User Preference
  let userInterval = minInterval;
  if (sourceFreq === "weekly") userInterval = ONE_WEEK;
  if (sourceFreq === "monthly") userInterval = ONE_MONTH;
  if (sourceFreq === "daily") userInterval = ONE_DAY;

  // 3. The effective interval is the Stricter (Larger) of the two
  return Math.max(minInterval, userInterval);
}

// --- DISPATCHER ---

export const scoutDispatcher = onSchedule(
  {
    schedule: "every day 09:00", // Updated to support Daily scraping frequency
    timeZone: "America/Los_Angeles",
    retryCount: 3,
    memory: "512MiB",
  },
  async () => {
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

    for (const doc of venuesSnap.docs) {
      const venue = doc.data() as Venue;
      if (!venue.scraper_config) continue;

      for (const source of venue.scraper_config) {
        // FILTER: Only Active Sources
        if (!source.isEnabled) continue;

        // FILTER: Check Stale status based on Tier and Preference
        const lastRun = source.lastScraped || 0;
        const requiredInterval = getScrapeInterval(
          venue.partner_tier,
          source.frequency,
        );
        const isStale = now - lastRun > requiredInterval;

        // Note: We use strict stale check here to respect the schedule.
        // Pending items are handled by onScraperRequest/onVenueUpdate.
        if (isStale && source.status !== "pending") {
          const messageData = {
            venueId: venue.id,
            sourceId: source.id,
            url: source.url,
            previousHash: source.contentHash || "",
            tier: venue.partner_tier || "local",
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
      "GOOGLE_GENAI_API_KEY",
      "GOOGLE_BACKEND_KEY",
      "VITE_GOOGLE_BROWSER_KEY",
      "INTERNAL_HEALTH_TOKEN",
    ],
  },
  async (event) => {
    const { venueId, sourceId, url, previousHash } = event.data.message.json;
    console.log(
      `🤖 [Worker] Scout allocated for ${venueId} source ${sourceId} (${url})`,
    );

    const venueRef = db.collection("venues").doc(venueId);

    // Step 1: Pre-Flight Checks
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
    const now = Date.now();
    const CACHE_TTL = 7 * 24 * 60 * 60 * 1000;

    // Default Allow
    let canScrape = true;
    let newRobotsCache = source.robotsCache;

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
      } catch {
        // Fail Open on Network Error
        newRobotsCache = { verdict: "allow", checkedAt: now };
      }
    } else if (source.robotsCache?.verdict === "disallow") {
      canScrape = false;
    }

    if (!canScrape) {
      // Calculate next retry (maybe 24h?)
      await updateSourceStatus(
        venueRef,
        venueData, // Pass full data to avoid re-fetch in transaction if possible, or just ref
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
          venueData,
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
    } finally {
      if (browser) await browser.close();
    }

    if (scrapeError) {
      const failures = (source.consecutiveFailures || 0) + 1;
      await updateSourceStatus(
        venueRef,
        venueData,
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
      let city = "Olympia, WA";
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

      const targetType = source.extractionMode || source.target || "EVENTS";
      let geminiTarget: "EVENTS" | "CALENDAR" | "MENU" | "DRINKS" | "NEWSLETTER" | "SOCIAL_FEED" | "WEBSITE" = "EVENTS";
      if (targetType === "MENU") geminiTarget = "MENU";
      if (targetType === "DRINKS") geminiTarget = "DRINKS";
      if (targetType === "CALENDAR") geminiTarget = "CALENDAR";
      if (targetType === "NEWSLETTER") geminiTarget = "NEWSLETTER";
      if (targetType === "WEBSITE") geminiTarget = "WEBSITE";

      const extractedData = await gemini.analyzeScrapedContent(
        rawText,
        todayPST,
        venueContext,
        geminiTarget,
        source.extractionNotes
      );

      // Step 4: The Scribe (Save Results)
      if (extractedData) {
        const batch = db.batch();

        if ((geminiTarget === "EVENTS" || geminiTarget === "CALENDAR") && Array.isArray(extractedData)) {
          console.log(`[Worker] Saving ${extractedData.length} ${geminiTarget} events.`);
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
        } else if (geminiTarget === "MENU" || geminiTarget === "DRINKS") {
          const venueRef_forUpdate = db.collection("venues").doc(venueId);
          batch.update(venueRef_forUpdate, {
            "ai_draft_profile.menu_highlights": extractedData
          });
          console.log(`[Worker] Updated Menu/Drinks highlights.`);
        } else if (geminiTarget === "WEBSITE") {
          const venueRef_forUpdate = db.collection("venues").doc(venueId);
          const websitePayload: any = {};
          if (extractedData.hours) websitePayload["hours_display"] = extractedData.hours;
          if (extractedData.amenities) websitePayload["ai_draft_profile.amenities"] = extractedData.amenities;
          if (extractedData.vibeKeywords) websitePayload["ai_draft_profile.vibe_keywords"] = extractedData.vibeKeywords;

          if (Object.keys(websitePayload).length > 0) {
            batch.update(venueRef_forUpdate, websitePayload);
          }
          console.log(`[Worker] Updated website recon data.`);
        }
        await batch.commit();
      }

      // Success Update
      await updateSourceStatus(
        venueRef,
        venueData,
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
        venueData,
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
  venueData: Venue, // Need PartnerTier to calc nextRun
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

    // Calc Next Run
    const interval = getScrapeInterval(
      data.partner_tier,
      data.scraper_config[idx].frequency,
    );
    const now = Date.now();
    const nextRun = now + interval;

    const sources = [...data.scraper_config];
    sources[idx] = {
      ...sources[idx],
      status,
      lastScraped: now,
      nextRun, // [NEW] Saved for UI
      errorMsg: errorMsg || undefined,
      consecutiveFailures, // Reset or Increment
      ...(contentHash ? { contentHash } : {}),
      ...(robotsCache ? { robotsCache } : {}),
    };

    t.update(venueRef, { scraper_config: sources });
  });
}
