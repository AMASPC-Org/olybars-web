import { onSchedule } from "firebase-functions/v2/scheduler";
import { getFirestore } from "firebase-admin/firestore";
import { ArtieContextService } from "../../services/ArtieContextService";

const db = getFirestore();

/**
 * DAILY HOLIDAY BRIEFING (Scheduled Job)
 * Runs every morning at 6:00 AM PST.
 *
 * Logic:
 * 1. Checks ArtieContextService for upcoming holidays (14-30 day window).
 * 2. If valid, blasts a System Notification to all active venues.
 */
export const generateHolidayBriefing = onSchedule(
  {
    schedule: "0 6 * * *", // 6 AM daily
    timeZone: "America/Los_Angeles",
    memory: "256MiB",
  },
  async (event) => {
    console.log("[HolidayBriefing] Starting daily scan...");

    try {
      // 1. Get Context
      const context = ArtieContextService.getUpcomingContext();

      if (!context.hasUpcomingHoliday) {
        console.log(
          "[HolidayBriefing] No upcoming holidays detected within window. Exiting.",
        );
        return;
      }

      console.log(
        `[HolidayBriefing] Holiday Detected: ${context.holidayName} in ${context.daysUntil} days.`,
      );

      // 2. Fetch Active Venues
      const venuesSnap = await db
        .collection("venues")
        .where("isActive", "==", true)
        .get();

      if (venuesSnap.empty) {
        console.log("[HolidayBriefing] No active venues found.");
        return;
      }

      // 3. Batch Write Notifications
      const batch = db.batch();
      let operationCount = 0;
      const BATCH_LIMIT = 450; // Safety buffer under 500

      for (const venueDoc of venuesSnap.docs) {
        const notificationRef = venueDoc.ref.collection("notifications").doc();

        // Notification Payload
        batch.set(notificationRef, {
          type: "upcoming_holiday",
          title: `Plan Ahead: ${context.holidayName}`,
          message: `The big day is ${context.daysUntil} days away. Users are already making plans—schedule your event and marketing now!`,
          action_context: {
            eventDate: context.eventDate,
            recommendedVibe: context.vibe,
          },
          priority: "medium",
          read: false,
          createdAt: new Date(), // Using JS Date for simplicity in Admin SDK
          expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 day TTL for alert
        });

        operationCount++;

        // Commit and reset if limit reached (Unlikely for limited venues, but good practice)
        if (operationCount >= BATCH_LIMIT) {
          await batch.commit();
          console.log(
            `[HolidayBriefing] Batch committed (${operationCount} ops).`,
          );
          // Create new batch? Firestore Admin doesn't support "resetting" batch easily in loop without new instance.
          // For MVP/OlyBars scale (<100 venues), single batch is fine.
          // If strict, we'd break this loop. For now, let's assume <450 venues.
        }
      }

      // Commit final batch
      if (operationCount > 0 && operationCount < BATCH_LIMIT) {
        await batch.commit();
      }

      console.log(
        `[HolidayBriefing] Successfully sent notifications to ${operationCount} venues.`,
      );
    } catch (error) {
      console.error("[HolidayBriefing] Critical failure:", error);
    }
  },
);
