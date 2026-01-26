import { Venue, AppEvent } from "../types";
import { API_BASE_URL } from "../lib/api-config";
import { getAuthHeaders } from "../services/apiUtils";

export class SchmidtLLM {
  /**
   * Generates a professional press release for an event.
   * Bridged to the OlyBars AI Backend.
   */
  static async generatePressRelease(
    venue: Venue,
    event: AppEvent,
  ): Promise<string> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/ai/generate-press-release`,
        {
          method: "POST",
          headers: await getAuthHeaders(),
          body: JSON.stringify({
            venueId: venue.id,
            eventId: event.id,
            eventTitle: event.title,
            eventDate: event.date,
            eventTime: event.time,
            eventDescription: event.description,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Schmidt failed to draft the press release.",
        );
      }

      const data = await response.json();
      return data.pressRelease;
    } catch (error) {
      console.error("SchmidtLLM Error:", error);
      // Fallback to a basic template if AI fails
      return `
FOR IMMEDIATE RELEASE

Event: ${event.title}
Location: ${venue.name} (${venue.address})
Date/Time: ${event.date} at ${event.time}

OLYMPIA, WA – ${venue.name} is proud to announce ${event.title}, taking place on ${event.date}. 
${event.description || "Join us for this special local event."}

Contact: ${venue.name} Administration
            `.trim();
    }
  }
}
