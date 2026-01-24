import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

export class ArtieContextService {
  /**
   * Fetches "The Pulse" - a real-time snapshot of the platform's state.
   */
  static async getPulse() {
    try {
      // 1. Get Top 3 Buzzing Venues (In-memory filter to avoid composite index)
      const venuesSnapshot = await db
        .collection("venues")
        .where("isActive", "==", true)
        .get();

      const buzzing = venuesSnapshot.docs
        .map((doc) => doc.data())
        .filter((v) => v.status === "buzzing" || v.status === "packed")
        .slice(0, 3)
        .map((v) => v.name);

      // 2. Get Global Platform Settings/Messages
      const settingsDoc = await db.collection("settings").doc("platform").get();
      const settings = settingsDoc.exists ? settingsDoc.data() : {};

      // 3. Flash Bounties: Fetch active deals directly from venues
      const now = Date.now();
      const dealsSnapshot = await db
        .collection("venues")
        .where("activeflashBounty.isActive", "==", true)
        .where("activeflashBounty.endTime", ">", now)
        .get();

      const activeDeals = dealsSnapshot.docs.map((doc) => ({
        venueId: doc.id,
        venueName: doc.data().name,
        ...doc.data().activeflashBounty,
      }));

      const deals = activeDeals.map((data) => {
        return `${data.title} at ${data.venueName}`;
      });

      // 4. Get Upcoming Events (Next 24h)
      const events = venuesSnapshot.docs
        .map((doc) => doc.data())
        .filter((v) => v.leagueEvent && v.leagueEvent !== "none")
        .map((v) => {
          const eventType = v.leagueEvent.toUpperCase();
          const time = v.triviaTime || "See App";
          const desc = v.eventDescription ? ` - ${v.eventDescription}` : "";
          return `${eventType} at ${v.name} (${time})${desc}`;
        });

      // 5. Get Happy Hour Context (New)
      const happyHourSpots = venuesSnapshot.docs
        .map((doc) => doc.data())
        .filter((v) => v.happyHourSimple)
        .slice(0, 5)
        .map(
          (v) =>
            `${v.name}: ${v.happyHourSimple}${v.happyHourSpecials ? ` (${v.happyHourSpecials})` : ""}`,
        );

      return {
        timestamp: new Date().toISOString(),
        buzzingVenues: buzzing,
        platformMessage:
          settings?.motd ||
          "The Artesian water is crisp and the vibes are high.",
        activeDealsCount: dealsSnapshot.size,
        activeDeals: deals,
        upcomingEvents: events,
        happyHours: happyHourSpots,
        leagueStatus: settings?.leagueStatus || "Open",
      };
    } catch (error) {
      console.error("ArtieContextService: Failed to fetch pulse", error);
      return null;
    }
  }

  /**
   * Generates a string summary of the pulse for injection into prompts.
   */
  static async getPulsePromptSnippet() {
    const pulse = await this.getPulse();
    if (!pulse) return "";

    return `
[REAL-TIME SITE CONTEXT]
Timestamp: ${pulse.timestamp}
Buzzing Venues: ${pulse.buzzingVenues.length > 0 ? pulse.buzzingVenues.join(", ") : "All quiet on the waterfront."}
Flash Bounties Active: ${pulse.activeDealsCount} ${pulse.activeDeals.length > 0 ? `(${pulse.activeDeals.join("; ")})` : ""}
Happy Hour Specials: ${pulse.happyHours.length > 0 ? pulse.happyHours.join(" | ") : "No specific HH intel right now."}
Upcoming Events: ${pulse.upcomingEvents.length > 0 ? pulse.upcomingEvents.join(", ") : "No sanctioned events on the wire."}
Status: ${pulse.platformMessage}
League Standing: ${pulse.leagueStatus}
`;
  }
  /**
   * Checks for upcoming platform-wide holidays (14-30 days out)
   * used for driving "Plan Ahead" notifications.
   */
  static getUpcomingContext(): {
    hasUpcomingHoliday: boolean;
    holidayName?: string;
    daysUntil?: number;
    eventDate?: string;
    vibe?: string;
  } {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Holiday Registry (Month is 0-indexed in JS Date)
    const holidays = [
      { name: "St. Patrick's Day", month: 2, day: 17, vibe: "high-energy" }, // March 17
      { name: "Cinco de Mayo", month: 4, day: 5, vibe: "festive" }, // May 5
      { name: "Independence Day", month: 6, day: 4, vibe: "party" }, // July 4
    ];

    for (const h of holidays) {
      let holidayDate = new Date(currentYear, h.month, h.day);

      // Handle year wrap-around if needed (though mostly we care about 'upcoming' in current year)
      if (holidayDate < now) {
        holidayDate = new Date(currentYear + 1, h.month, h.day);
      }

      const diffTime = holidayDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Window: 14 to 30 days
      if (diffDays >= 14 && diffDays <= 30) {
        return {
          hasUpcomingHoliday: true,
          holidayName: h.name,
          daysUntil: diffDays,
          eventDate: holidayDate.toISOString().split("T")[0],
          vibe: h.vibe,
        };
      }
    }

    return { hasUpcomingHoliday: false };
  }
}
