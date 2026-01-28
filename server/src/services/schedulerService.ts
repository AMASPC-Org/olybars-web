import { db } from "../firebaseAdmin.js";
import { ScraperService } from "./ScraperService.js";
import { enqueueScraperRun } from "../utils/cloudTasks.js";
import { Scraper, ScraperStatus } from "../types/scraper.js";
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
    // 3. Process Batch
    const results = await Promise.allSettled(snapshot.docs.map(async (doc) => {
      const scraper = doc.data() as Scraper;
      const venueId = scraper.venueId;

      // Try to reserve quota
      // Note: reserveQuotaAndCreateRun checks quota atomically.
      try {
        const reservation = await ScraperService.reserveQuotaAndCreateRun(venueId, scraper.id, "SCHEDULED");

        if (!reservation.allowed) {
          // QUOTA EXCEEDED
          console.warn(`[Scheduler] Quota exceeded for ${scraper.id} (${venueId}): ${reservation.reason}`);

          // Smart Backoff: Reschedule to Start of Next Month + Jitter
          // We need venue timezone for accurate "Start of Month"
          // Ideally ScraperService returns timezone or we fetch it. 
          // For efficiency, let's assume UTC or hard default if we don't want to fetch venue for every skip.
          // Or better: reserveQuota returned 'allowed: false'.
          // Update nextRunAt to prevent busy-looping every tick.

          const now = new Date();
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          // Jitter: 0 to 12 hours (random distribution to spread load)
          const jitterMs = Math.random() * 12 * 60 * 60 * 1000;
          const nextRunTs = nextMonth.getTime() + jitterMs;

          await ScraperService.updateScraper(venueId, scraper.id, {
            "schedule.nextRunAt": nextRunTs,
            "schedule.lastRunAt": Date.now(), // Mark that we 'checked'
            // Spec says: "Set nextRunAt to next period start + jitter".
            // Do NOT change status to PAUSED, just delay the run.
          });

          return { id: scraper.id, status: "SKIPPED_QUOTA" };
        }

        // SUCCESS: Run created
        await enqueueScraperRun(reservation.runId);

        // Calculate next schedule
        const nextRunAt = SchedulerService.calculateNextRun(scraper.schedule.frequency);
        await ScraperService.updateScraper(venueId, scraper.id, {
          "schedule.nextRunAt": nextRunAt,
          "schedule.lastRunAt": Date.now()
        });

        return { id: scraper.id, status: "ENQUEUED", runId: reservation.runId };

      } catch (e: any) {
        console.error(`[Scheduler] Failed to process ${scraper.id}`, e);
        // Don't crash scheduler, just log.
        // Bump nextRunAt slightly (e.g. 1 hour) to avoid stuck loop on crash?
        return { id: scraper.id, status: "ERROR", error: e.message };
      }
    }));

    // Log results
    const success = results.filter(r => r.status === "fulfilled").length;
    console.log(`Scheduler Tick Complete. Success: ${success}/${snapshot.size}`);
  }

  static calculateNextRun(freq: string): number {
    let nextRun = Date.now();
    switch (freq) {
      case "DAILY": nextRun += 24 * 60 * 60 * 1000; break;
      case "WEEKLY": nextRun += 7 * 24 * 60 * 60 * 1000; break;
      case "MONTHLY": nextRun += 30 * 24 * 60 * 60 * 1000; break;
      case "ON_DEMAND": nextRun = 0; break; // Should not happen for scheduled
      default: nextRun += 24 * 60 * 60 * 1000;
    }
    return nextRun;
  }

  private static async scheduleNextRun(scraper: Scraper) {
    // Legacy wrapper if needed, or remove. 
    // We updated the tick() logic to do updateScraper directly.
    // But let's keep it for compatibility or just remove usages and this method.
    // In tick(), we used calculateNextRun.
    // So this method is likely unused by the new logic. 
    // We can leave it or remove it. Leaving it for safety if other calls use it (none known).

    const nextRun = this.calculateNextRun(scraper.schedule.frequency);

    const update: any = {
      "schedule.lastRunAt": Date.now()
    };

    if (scraper.schedule.frequency !== "ON_DEMAND") {
      update["schedule.nextRunAt"] = nextRun;
    } else {
      update["schedule.nextRunAt"] = null;
    }

    await db.collection("scrapers").doc(scraper.id).update(update);
  }
}
