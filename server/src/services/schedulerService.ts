import { db } from "../firebaseAdmin.js";
import { ScraperService } from "./scraperService.js";
import { enqueueScraperRun } from "../utils/cloudTasks.js";
import { Scraper } from "../types/scraper.js";
import { ScraperFrequency } from "../types/scraper.js";

export class SchedulerService {
  static async tick() {
    console.log("Scheduler Tick Starting...");

    const now = Date.now();

    // Query due scrapers
    // Index required: venues (collection group? no, scrapers collection) 
    // scrapers where deleted == false AND schedule.isEnabled == true AND schedule.nextRunAt <= now

    const snapshot = await db.collection("scrapers")
      .where("deleted", "==", false)
      .where("schedule.isEnabled", "==", true)
      .where("schedule.nextRunAt", "<=", now)
      .orderBy("schedule.nextRunAt", "asc")
      .limit(50) // Batch limit
      .get();

    if (snapshot.empty) {
      console.log("No due scrapers found.");
      return;
    }

    console.log(`Found ${snapshot.size} due scrapers.`);

    const results = await Promise.allSettled(snapshot.docs.map(async (doc) => {
      const scraper = doc.data() as Scraper;
      try {
        // 1. Reserve Quota
        const { runId, allowed, reason } = await ScraperService.reserveQuotaAndCreateRun(
          scraper.venueId,
          scraper.id,
          "SCHEDULED"
        );

        if (!allowed) {
          console.warn(`Quota exceeded for ${scraper.id}: ${reason}`);
          // Push next run time anyway so we don't loop forever?
          // Yes, enforce "Missed Run" logic or just push out.
          await this.scheduleNextRun(scraper);
          return { scraperId: scraper.id, status: "quota_exceeded" };
        }

        // 2. Enqueue Task
        await enqueueScraperRun(runId);

        // 3. Update Schedule
        await this.scheduleNextRun(scraper);

        return { scraperId: scraper.id, status: "enqueued", runId };

      } catch (e) {
        console.error(`Failed to process scraper ${scraper.id}`, e);
        throw e;
      }
    }));

    // Log results
    const success = results.filter(r => r.status === "fulfilled").length;
    console.log(`Scheduler Tick Complete. Success: ${success}/${snapshot.size}`);
  }

  private static async scheduleNextRun(scraper: Scraper) {
    const freq = scraper.schedule.frequency;
    let nextRun = Date.now();

    // Basic scheduling (plus logic to avoid drift if desired, but simple add is fine)
    switch (freq) {
      case "DAILY":
        nextRun += 24 * 60 * 60 * 1000;
        break;
      case "WEEKLY":
        nextRun += 7 * 24 * 60 * 60 * 1000;
        break;
      case "MONTHLY":
        nextRun += 30 * 24 * 60 * 60 * 1000;
        break;
      case "ON_DEMAND":
        nextRun = 0; // Disable or set null?
        break;
      default:
        nextRun += 24 * 60 * 60 * 1000; // Default daily
    }

    const update: any = {
      "schedule.lastRunAt": Date.now()
    };

    if (freq !== "ON_DEMAND") {
      update["schedule.nextRunAt"] = nextRun;
    } else {
      update["schedule.nextRunAt"] = null; // Wait for manual
    }

    await db.collection("scrapers").doc(scraper.id).update(update);
  }
}
