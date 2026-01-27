# Bead: B008 - Scraper Foundations & Schema Alignment

> **Status**: Completed
> **Agent**: V3R1
> **Priority**: Critical
> **Type**: Infrastructure / Types
> **Dependencies**: None
> **Estimated Effort**: Medium

## Context
The scraper infrastructure is the bridge between raw web content and the OlyBars Venue Profiles. Currently, the system only natively understands `EVENTS`, `MENU`, and `NEWSLETTER`. To support the expansion to `CALENDAR` and `DRINKS`, we must first align our type system and ensure that the "Staging Area" (the `ai_draft_profile` in Firestore) is ready to receive data from these new sources without breaking the dashboard UI.

## Reasoning & Justification
- **Schema First:** By aligning types first, we prevent TypeScript errors during the AI implementation.
- **Architectural Cleanup:** We're addressing the "Gemini Drift" where the AI service logic differs between the `server` and `functions`. This ensures consistent behavior across all environments.
- **Data Integrity:** Aligning the `ai_draft_profile` format ensures that the owner never sees "Undefined" or "Object Object" when the AI extracts a list of beers.

## Goals
1.  **Unified Targets:** Expand the `ScrapeTarget` union to include `CALENDAR` and `DRINKS`.
2.  **Schema Alignment:** Document and enforce the standard for `ai_draft_profile` highlights and deals.
3.  **Core Sync:** Harmonize `GeminiService.ts` between the server and functions directories.

## Implementation Details

### 1. Types & Migration
- [ ] Modify `src/types/venue.ts`:
    - Add `CALENDAR` and `DRINKS` to `ScrapeTarget`.
- [ ] Create `server/src/scripts/migrate-scraper-config.ts`:
    - Script to scan all venues and optionally re-categorize "WEBSITE" targets if their URL patterns match "menu" or "drinks".
    - This ensures existing users benefit from the new specialized AI logic without manual re-entry.

### 2. Service Harmonization (The "Golden Source")
- [ ] Harmonize `functions/src/services/geminiService.ts` and `server/src/services/geminiService.ts`.
- [ ] Abstract shared prompts into a common config if possible, or ensure identical logic for:
    - `analyzeScrapedContent` signature update (accept `rules?: string`).
    - Standardized JSON error recovery logic.

### 3. Legacy Service Alignment
- [ ] Update `server/src/services/ScraperService.ts` (Legacy) to support routing for `CALENDAR` and `DRINKS` to ensure local testing remains parity-accurate.

## Acceptance Criteria
- [ ] `npm run build` passes in both `functions/` and `src/`.
- [ ] `ScrapeTarget` includes all 6 targets.
- [ ] `ai_draft_profile` matches the structure expected by the `ScraperManagementTab` UI.
