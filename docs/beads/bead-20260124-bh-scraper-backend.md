# Bead: Scraper Backend Engine & Logic

> "The Brain and The Bouncer"

## Status
- [x] **Complete**
- [x] **Closed**
- [x] **Locked** (2026-01-27)

## Objective

Implement the backend Cloud Functions and logic to handle:

1.  **Rate Limiting & Tier Enforcement** ("The Bouncer"): Ensure venues only scrape as often as their tier allows (Daily vs Weekly vs Monthly).
2.  **Strategic Dispatch** ("The Brain"): Different logic for `EVENTS` (Cal/FB), `MENU` (Untappd/Text), `WEBSITE` (General), and `SOCIAL_FEED` (Insta).
3.  **Efficiency**: Check `contentHash` to only charge tokens/write updates if _new_ information is found.

## Specifications

### 1. The Bouncer (Frequency Logic)

- **Location**: `functions/src/scrapers/scheduler.ts`
- **Logic**:
  - Read `venue.partner_tier`.
  - Map Tier -> Allowed Frequency (e.g. `Tier.LOCAL` = Weekly, `Tier.PRO` = Daily, `Tier.AGENCY` = Hourly/On-Demand).
  - Check `lastScrapedAt`. If `now - lastScrapedAt < interval`, ABORT with "Rate Limited" status.
- **Override**: Manual "Force Sync" (from UI) bypasses _Time_ check but enforces _Max Manual Triggers per Month_ (e.g., 5/mo for Local).

### 2. The Brain (Dispatch)

- **Location**: `functions/src/scrapers/index.ts`
- **Strategies**:
  - **WEBSITE**: Use Puppeteer/Cheerio. Look for `extractionNotes` context (e.g. "Live Music section"). Extract text, hash it.
  - **EVENTS**: Detect if FB Event URL or Google Calendar. Use specific selectors.
  - **MENU**: Detect Untappd/DigitalPour. Use API integration if possible, else generic list extraction.
  - **SOCIAL_FEED**: Requires Meta Graph API (if officially connected) or specialized scraper service.

### 3. Change Detection (Efficiency)

- **Step**: Calculate `md5(extractedText)`.
- **Compare**: `currentHash` vs `firestore.scraper_config[i].contentHash`.
- **Action**:
  - If Match: Update `lastScraped`. Log "No Changes".
  - If Diff: Update `contentHash`. Trigger `Genkit` flow to parse unstructured text -> Structured Events/Menu.

## Deliverables

- [x] `functions/src/scout/index.ts`: The gating logic (Dispatcher) & Worker.
- [x] `functions/src/scout/index.ts`: Generic Scout + Gemini Analysis strategy.
- [x] `functions/src/triggers/onScraperRequest.ts`: The Cloud Function listening to `venues/{id}/automation/status`.

## Implementation Notes

- **Architecture**: Implemented a `scoutDispatcher` (Scheduler) and `scoutWorker` (Pub/Sub Worker) model.
- **Tier Logic**: Logic resides in `scoutDispatcher`.
  - **Local**: Limited to Weekly (Max).
  - **DIY/Pro/Agency**: Defaults to Daily, respects user preference (Weekly/Monthly).
- **Strategy**: Instead of brittle selectors, we use a "Universal Scout" (Puppeteer) to fetch raw text, followed by "The Brain" (Gemini 1.5 Flash) to parse structured data (Events). This simplifies maintenance.
- **Manual Sync**: `onScraperRequest` trigger handles manual overrides.

## Context

Refrence `src/types/venue.ts` for `ScraperSource` interface.
Refrence `docs/specs/Brew_House_Specifications.md` Tab [12].
