import { GeminiService } from "./geminiService";

/**
 * ArtieCacheService: Phase 2/3 FinOps Maturity
 * Manages Vertex AI Context Caching for the static parts of Artie's brain.
 */
export class ArtieCacheService {
  private static cacheName: string | null = null;
  private static lastCreated: number = 0;
  private static CACHE_TTL = 24 * 60 * 60 * 1000; // 24 Hours (FinOps: Maximize reuse)
  private static TOKEN_THRESHOLD = 32768; // Vertex AI/Gemini minimum for context caching

  /**
   * Retrieves or creates a Vertex AI Content Cache for Artie's static instructions.
   */
  static async getOrSetStaticCache(
    service: GeminiService,
    staticSystemInstruction: string,
  ) {
    const now = Date.now();

    // 1. Threshold Guard: Economically viable only above 32k tokens
    // Rough estimate: 4 chars = 1 token
    const approxTokens = staticSystemInstruction.length / 4;

    if (approxTokens < this.TOKEN_THRESHOLD) {
      console.log(
        `[ZENITH] Lore context (${approxTokens} tokens) below threshold. Skipping cache.`,
      );
      return null;
    }

    // 2. SWR / TTL Logic
    if (this.cacheName && now - this.lastCreated < this.CACHE_TTL) {
      return this.cacheName;
    }

    try {
      console.log(
        `[ZENITH] Initializing context cache for Artie's KB (${approxTokens} tokens)...`,
      );

      // Using the @google/genai SDK cache management
      const result = await (service as any).genAI.caches.create({
        model: "gemini-2.0-flash",
        systemInstruction: { parts: [{ text: staticSystemInstruction }] },
        ttl: { seconds: 86400 }, // 24 Hours
      });

      this.cacheName = result.name;
      this.lastCreated = now;
      console.log(`[ZENITH] Context cache created: ${this.cacheName}`);
      return this.cacheName;
    } catch (error: any) {
      console.warn("[ZENITH] Context Caching failed:", error.message);
      return null;
    }
  }

  /**
   * Forces a cache refresh (e.g., after large KB update)
   */
  static invalidateCache() {
    this.cacheName = null;
    this.lastCreated = 0;
  }
}
