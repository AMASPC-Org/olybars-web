import { API_ENDPOINTS } from "../lib/api-config";
import { getAuthHeaders } from "./apiUtils";
import { Scraper } from "../types/scraper";

export class ScraperApiClient {
  /**
   * List all scrapers for a venue
   */
  static async listScrapers(venueId: string): Promise<Scraper[]> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.PARTNERS.SCRAPERS(venueId), { headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to list scrapers");
    }
    return response.json();
  }

  /**
   * Create a new scraper configuration
   */
  static async createScraper(venueId: string, data: Partial<Scraper>): Promise<string> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.PARTNERS.SCRAPERS(), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ ...data, venueId }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to create scraper");
    }
    const res = await response.json();
    return res.id;
  }

  /**
   * Update an existing scraper configuration
   */
  static async updateScraper(venueId: string, scraperId: string, updates: Partial<Scraper>): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.PARTNERS.SCRAPER_DETAIL(scraperId, venueId), {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ ...updates, venueId }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to update scraper");
    }
  }

  /**
   * Delete a scraper
   */
  static async deleteScraper(venueId: string, scraperId: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.PARTNERS.SCRAPER_DETAIL(scraperId, venueId), {
      method: "DELETE",
      headers: { "Content-Type": "application/json", ...headers },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Failed to delete scraper");
    }
  }

  /**
   * Trigger a scraper run manually
   */
  static async runScraper(venueId: string, scraperId: string): Promise<{ runId: string, allowed: boolean, reason?: string }> {
    const headers = await getAuthHeaders();
    const response = await fetch(API_ENDPOINTS.PARTNERS.SCRAPER_RUN(scraperId), {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ venueId }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (response.status === 402) {
        return { runId: "", allowed: false, reason: err.error || "Quota Limit Reached" };
      }
      throw new Error(err.error || "Failed to run scraper");
    }
    return response.json();
  }
}
