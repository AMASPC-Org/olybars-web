# Plan Audit - Brewer House Scraper

## Top 10 Risks & Mitigations

1.  **Cost Runaway (Playwright)**:
    *   *Risk*: Rendering every page with Playwright is expensive (CPU/Memory) and slow.
    *   *Mitigation*: Use `http` fetch first. Only use Playwright if `render_required` flag is set or static fetch fails to find content. Enforce concurrency limits.
2.  **Quota Race Conditions**:
    *   *Risk*: Parallel requests (Run Now + Scheduler) exceeding monthly limits.
    *   *Mitigation*: Firestore Transactions for ALL quota reservations. "Check-then-Act" is atomic.
3.  **Infinite Retries (Cloud Tasks)**:
    *   *Risk*: A failing task retries forever, burning cost/quota.
    *   *Mitigation*: Return `2xx` for non-retryable errors (e.g., parsing failed, invalid URL). Only return `5xx`/`429` for transient issues. configure `maxAttempts`.
4.  **SSRF (Server-Side Request Forgery)**:
    *   *Risk*: User enters `http://localhost:8080/admin` or cloud metadata URL.
    *   *Mitigation*: Strict valid URL check + DNS resolution of every hop + block private IP ranges.
5.  **LLM Hallucinations**:
    *   *Risk*: LLM invents events that don't exist.
    *   *Mitigation*: Provide source HTML text in prompt. Use strict Zod schema for output. Include `content_hash` to verify freshness.
6.  **Legal/Robots Compliance**:
    *   *Risk*: Scraping disallowed sites leads to bans or legal threats.
    *   *Mitigation*: Respect `robots.txt`. If `Disallow`, mark scraper status as `BLOCKED` and prevent runs.
7.  **Data Volatility**:
    *   *Risk*: "Changed" detection is flaky (hashes change due to timestamps/ads).
    *   *Mitigation*: Normalize text (remove whitespace, scripts, styles) before hashing. Use "Link Fingerprint" (sorted list of hrefs).
8.  **Cloud Run Cold Starts**:
    *   *Risk*: Worker latency on first run.
    *   *Mitigation*: Not critical for async background tasks.
9.  **Firestore Index Explosion**:
    *   *Risk*: Complex queries for scheduling.
    *   *Mitigation*: Keep scheduler query simple (`next_run_at <= now` + `enabled == true`).
10. **Secret Leaks in Logs**:
    *   *Risk*: Logging full HTML or sensitive URLs.
    *   *Mitigation*: Sanitize logs. Never log raw HTML content.

## Cloud Tasks Semantics Verification
*   **Success**: HTTP 2xx.
*   **Retry**: HTTP 429, 5xx.
*   **Fatal**: HTTP 4xx (except 429). We will map "Logical Failure" (e.g., scraper broken) to 200 OK + `status: error` in Firestore to stop retries.

## Quota-Reservation
*   **Mechanism**: Firestore Transaction.
*   **Steps**:
    1.  Read `partner_usage_months/{key}`.
    2.  Check `count < limit`.
    3.  Write `increment` + `run_doc` + `dedup_marker` atomically.
*   **Safety**: Guaranteed race-safe by Firestore.

## Deviations from Existing Code
*   **New Collection**: Migrating from `venue.scraper_config` array to `scrapers` collection. This is necessary for scale and history tracking.
*   **New Service**: Adding `worker` logic. Currently, `olybars-backend` is a monolith. We will keep it monolithic (same docker image) but add a new route `/internal/tasks/run` to handle tasks, rather than deploying a separate container image immediately, to save complexity/cost. It acts as a "Service" via routing.
