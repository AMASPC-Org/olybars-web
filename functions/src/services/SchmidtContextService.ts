import { getFirestore } from "firebase-admin/firestore";
import { initializeApp, getApps } from "firebase-admin/app";

if (getApps().length === 0) {
  initializeApp();
}

const db = getFirestore();

export class SchmidtContextService {
  /**
   * Fetches "The Pulse" - focused on operational health and yield opportunities.
   */
  static async getPulse() {
    try {
      const venuesSnapshot = await db
        .collection("venues")
        .where("isActive", "==", true)
        .get();

      const venues = venuesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      // 1. Identify "Yield Gaps" (Mellow venues that need a push)
      const yieldGaps = venues
        .filter((v) => v.status === "mellow" || v.status === "open")
        .slice(0, 5)
        .map((v) => v.name);

      // 2. Performance Leaders (Buzzing/Packed)
      const leaders = venues
        .filter((v) => v.status === "buzzing" || v.status === "packed")
        .slice(0, 3)
        .map((v) => v.name);

      // 3. Financial Context (Flash Bounties in play)
      const now = Date.now();
      const activeDeals = venues
        .filter(v => v.activeflashBounty?.isActive && v.activeflashBounty?.endTime > now)
        .map(v => `${v.activeflashBounty.title} at ${v.name}`);

      return {
        timestamp: new Date().toISOString(),
        yieldGaps,
        leaders,
        activeDeals,
        platformStatus: "Operational",
      };
    } catch (error) {
      console.error("SchmidtContextService: Failed to fetch pulse", error);
      return null;
    }
  }

  /**
   * Generates ROI-focused pulse snippet.
   */
  static async getPulsePromptSnippet() {
    const pulse = await this.getPulse();
    if (!pulse) return "";

    return `
[GLOBAL YIELD SNAPSHOT]
Timestamp: ${pulse.timestamp}
Yield Gaps (Mellow spots needing ROI capture): ${pulse.yieldGaps.join(", ")}
Performance Leaders: ${pulse.leaders.join(", ")}
Active Flash Bounties: ${pulse.activeDeals.length} current campaigns.
`;
  }

  /**
   * Fetches deep-dive B2B context for a specific venue.
   */
  static async getOwnerContextPromptSnippet(venueId: string) {
    if (!venueId) return "[ERROR] No venue context provided.";

    try {
      const venueDoc = await db.collection("venues").doc(venueId).get();
      if (!venueDoc.exists) return "[ERROR] Inaccessible venue record.";

      const v = venueDoc.data() as any;
      const buzzScore = v.currentBuzz?.score || 0;
      const capacity = v.capacity || 100;
      const footfallEst = Math.round((buzzScore / 100) * capacity);

      // Heuristic ROI: Items tagged as 'special' or having high capacity availability
      const yieldPotential = v.capacity > 100 && v.status === 'mellow' ? "HIGH (Excess Capacity)" : "STANDARD";

      return `
[VENUE BUSINESS SNAPSHOT: ${v.name}]
Current Buzz: ${buzzScore}/100 
Estimated Footfall: ${footfallEst}/${capacity} guests
Yield Potential: ${yieldPotential}
Active Deal: ${v.activeflashBounty?.isActive ? v.activeflashBounty.title : "NONE"}
Status: ${v.status}
Goal: Minimize "Mellow" idle time, Maximize "Buzzing" conversion.
`;
    } catch (e) {
      return "[ERROR] Business intelligence layer timed out.";
    }
  }
}
