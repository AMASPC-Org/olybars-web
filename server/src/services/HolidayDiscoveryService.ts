import { db } from "../firebaseAdmin.js";
import { DiscoveredHoliday } from "../../../src/types/context_system.js";

export class HolidayDiscoveryService {
  private static COLLECTION = "discovered_holidays";

  /**
   * Simulates/Executes ingestion from an external Holiday API
   * In a real production environment, this would call AbstractAPI or similar.
   */
  static async ingestHolidays(year: number): Promise<number> {
    console.log(`🔍 Starting holiday discovery for ${year}...`);

    // MOCKED API RESPONSE
    // In reality, this would be: const response = await fetch(`https://api.abstractapi.com/v1/holidays/?api_key=${API_KEY}&country=US&year=${year}`);
    const mockApiResponse = [
      {
        name: "National Pizza Day",
        date: `${year}-02-09`,
        type: "National",
        description: "A day to celebrate the most popular food on earth.",
      },
      {
        name: "National Margarita Day",
        date: `${year}-02-22`,
        type: "Food/Drink",
        description: "Celebrate the classic cocktail.",
      },
      {
        name: "National Beer Day",
        date: `${year}-04-07`,
        type: "Beverage",
        description: "Anniversary of the end of prohibition for beer.",
      },
      {
        name: "National Wine Day",
        date: `${year}-05-25`,
        type: "Beverage",
        description: "A day for wine lovers.",
      },
      {
        name: "National Burger Day",
        date: `${year}-05-28`,
        type: "Food",
        description: "The ultimate comfort food celebration.",
      },
      {
        name: "National IPA Day",
        date: `${year}-08-01`,
        type: "Craft Beer",
        description: "Focusing on the hoppy goodness of IPAs.",
      },
      {
        name: "National Bourbon Day",
        date: `${year}-06-14`,
        type: "Spirits",
        description: "America's native spirit.",
      },
    ];

    let ingestedCount = 0;
    const batch = db.batch();

    for (const item of mockApiResponse) {
      const id = `${item.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${year}`;
      const docRef = db.collection(this.COLLECTION).doc(id);

      const payload: DiscoveredHoliday = {
        id,
        name: item.name,
        date: item.date,
        description: item.description,
        type: item.type,
        status: "PENDING",
        source: "Mock Discovery API",
        suggestedTags: this.inferTags(item.name, item.type),
        originalMetadata: item,
        createdAt: Date.now(),
      };

      batch.set(docRef, payload, { merge: true });
      ingestedCount++;
    }

    await batch.commit();
    console.log(
      `✅ Ingested ${ingestedCount} potential holidays into Discovery Queue.`,
    );
    return ingestedCount;
  }

  private static inferTags(name: string, type: string): string[] {
    const tags: string[] = [];
    const lower = (name + " " + type).toLowerCase();

    if (lower.includes("beer") || lower.includes("ipa"))
      tags.push("beer", "craft_beer");
    if (lower.includes("wine")) tags.push("wine");
    if (lower.includes("tequila") || lower.includes("margarita"))
      tags.push("tequila", "cocktails");
    if (lower.includes("whiskey") || lower.includes("bourbon"))
      tags.push("whiskey", "spirits");
    if (lower.includes("pizza") || lower.includes("food")) tags.push("food");
    if (lower.includes("burger")) tags.push("burgers", "food");

    return tags;
  }

  static async promoteHoliday(
    discoveryId: string,
    finalTags: string[],
    weatherCriteria?: any,
  ): Promise<void> {
    const discoveryRef = db.collection(this.COLLECTION).doc(discoveryId);
    const snap = await discoveryRef.get();

    if (!snap.exists) throw new Error("Discovery item not found");
    const discovery = snap.data() as DiscoveredHoliday;

    const calendarId = discovery.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const calendarRef = db.collection("system_calendar").doc(calendarId);

    // 1. Create the Live Calendar Event
    await calendarRef.set(
      {
        id: calendarId,
        name: discovery.name,
        date: discovery.date.substring(5), // Make recurring (MM-DD)
        description: discovery.description,
        target_tags: finalTags,
        weather_criteria: weatherCriteria || {},
        promotionMetadata: {
          promotedAt: Date.now(),
          originalSource: discovery.source,
        },
      },
      { merge: true },
    );

    // 2. Mark discovery item as APPROVED
    await discoveryRef.update({ status: "APPROVED" });
  }
}
