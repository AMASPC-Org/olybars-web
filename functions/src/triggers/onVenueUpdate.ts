import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { PubSub } from "@google-cloud/pubsub";
import { Venue, ScraperSource } from "../types/venue";

const pubsub = new PubSub();
const TOPIC_NAME = "venue-scrape-queue";

export const onVenueUpdate = onDocumentWritten(
  "venues/{venueId}",
  async (event) => {
    // 1. Validation
    if (!event.data) return; // Delete event
    const venueId = event.params.venueId;
    const afterData = event.data.after.data() as Venue | undefined;
    const beforeData = event.data.before.data() as Venue | undefined;

    if (!afterData || !afterData.scraper_config) return;

    // 2. Identify Pending Sources
    // We want to trigger if:
    // A) Source wasn't there before (New) AND is pending
    // B) Source was there but status changed to pending (Retry/Update)

    const pendingSources: ScraperSource[] = [];

    for (const source of afterData.scraper_config) {
      if (source.status !== "pending") continue; // Only care about pending
      if (!source.isEnabled) continue; // Safety check

      const oldSource = beforeData?.scraper_config?.find(
        (s: ScraperSource) => s.id === source.id,
      );

      // If it's new OR status changed to pending
      if (!oldSource || oldSource.status !== "pending") {
        pendingSources.push(source);
      }
    }

    if (pendingSources.length === 0) return;

    console.log(
      `[onVenueUpdate] Venue ${venueId} has ${pendingSources.length} pending sources. Dispatching.`,
    );

    // 3. Dispatch
    const batchPublisher = pubsub.topic(TOPIC_NAME);
    const publishPromises = pendingSources.map((source) => {
      const messageData = {
        venueId,
        sourceId: source.id,
        url: source.url,
        previousHash: source.contentHash || "",
      };
      const dataBuffer = Buffer.from(JSON.stringify(messageData));
      return batchPublisher.publishMessage({ data: dataBuffer });
    });

    await Promise.all(publishPromises);
    console.log(
      `[onVenueUpdate] Dispatched ${publishPromises.length} immediate jobs.`,
    );
  },
);
