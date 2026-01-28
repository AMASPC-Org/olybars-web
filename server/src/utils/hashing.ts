import crypto from "crypto";

/**
 * Generates a SHA-256 hash of the input string.
 * Used for content change detection.
 */
export function contentHash(text: string): string {
  // Normalize text: remove excessive whitespace to avoid flaky diffs
  const normalized = text.replace(/\s+/g, " ").trim();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Generates a "Link Fingerprint" hash.
 * Extracts all hrefs, sorts them, and hashes the list.
 * Good for detecting structural changes even if text changes slightly (or vice versa).
 */
export function linkFingerprint(html: string): string {
  const hrefs: string[] = [];
  const regex = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (match[1]) hrefs.push(match[1]);
  }
  const fingerprint = hrefs.sort().join("|");
  return crypto.createHash("sha256").update(fingerprint).digest("hex");
}

/**
 * Generates a standard ID for an event based on venue + title + date.
 * Ensures we don't duplicate events if they are scraped again.
 */
export function generateEventId(venueId: string, title: string, date: string): string {
  const raw = `${venueId}-${title}-${date}`.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return crypto.createHash("md5").update(raw).digest("hex");
}
