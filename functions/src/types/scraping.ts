export interface ScrapingMetadata {
    enabled: boolean;
    targetUrl: string;
    lastRun?: number; // timestamp
    lastSuccess?: number; // timestamp
    contentHash?: string; // MD5 of innerText from last run
    consecutiveEmptyScrapes: number;
    robotsCache?: {
        verdict: "allow" | "disallow";
        checkedAt: number; // timestamp
    };
    circuitBreaker?: {
        tripped: boolean;
        failCount: number;
        lastFailure?: number;
    };
}
