import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { PubSub } from "@google-cloud/pubsub";
import { Venue, ScraperSource } from "../types/venue";
import * as admin from "firebase-admin";

const pubsub = new PubSub();
const TOPIC_NAME = "venue-scrape-queue";
const db = admin.firestore();

/**
 * Trigger: Manual "Force Sync" Request
 * Path: venues/{venueId}/automation/status
 * Logic: When 'syncStatus' becomes 'running', dispatch all active scrapers for this venue immediately.
 */
export const onScraperRequest = onDocumentWritten(
  "venues/{venueId}/automation/status",
  async (event) => {
    const venueId = event.params.venueId;
    const after = event.data?.after.data();
    const before = event.data?.before.data();

    // 1. Validate Trigger
    if (!after) return; // Deleted
    if (after.syncStatus !== "running") return; // Only care about running state
    // Prevent infinite loops or redundant triggers if status hasn't changed to running
    if (before?.syncStatus === "running") return;

    console.log(
      `[onScraperRequest] Manual sync requested for Venue ${venueId}`,
    );

    // 2. Fetch Venue Configuration
    // We need the scraper_config from the parent venue document
    const venueRef = db.collection("venues").doc(venueId);
    const venueSnap = await venueRef.get();

    if (!venueSnap.exists) {
      console.error(`[onScraperRequest] Venue ${venueId} not found.`);
      return;
    }

    const venue = venueSnap.data() as Venue;

    if (!venue.is_scraping_enabled || !venue.scraper_config) {
      console.warn(
        `[onScraperRequest] Scraping disabled or no config for ${venueId}.`,
      );
      // Reset status to idle so they can try again if they fix config
      await event.data?.after.ref.update({
        syncStatus: "idle",
        lastError: "No active config",
      });
      return;
    }

    // 3. Dispatch Jobs
    const activeSources = venue.scraper_config.filter((s) => s.isEnabled);

    if (activeSources.length === 0) {
      console.warn(`[onScraperRequest] No active sources for ${venueId}.`);
      await event.data?.after.ref.update({ syncStatus: "idle" });
      return;
    }

    const batchPublisher = pubsub.topic(TOPIC_NAME);
    const publishPromises = activeSources.map((source) => {
      const messageData = {
        venueId,
        sourceId: source.id,
        url: source.url,
        previousHash: source.contentHash || "",
        isManual: true, // Flag for worker to skip some checks if needed
      };
      const dataBuffer = Buffer.from(JSON.stringify(messageData));
      return batchPublisher.publishMessage({ data: dataBuffer });
    });

    await Promise.all(publishPromises);
    console.log(
      `[onScraperRequest] Dispatched ${publishPromises.length} manual jobs.`,
    );

    // 4. Update Status to 'processing' (or keep 'running' until worker finishes? Worker doesn't update this doc currently)
    // The Worker updates venue.scraper_config[i].status.
    // We should probably set this doc to 'idle' shortly after dispatch, or leave it for the UI to poll per source?
    // User UI looks at `venue.scraper_config`.
    // The `automation/status` doc is mostly a trigger mechanism.
    // Let's reset it to 'idle' with a timestamp so the UI knows the *request* was processed.

    await event.data?.after.ref.update({
      syncStatus: "idle",
      lastRequestProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  },
);
