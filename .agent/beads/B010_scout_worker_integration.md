# Bead: B010 - Scout Worker Integration (Operational Target)

> **Status**: Open
> **Priority**: Medium
> **Type**: Backend / Functions
> **Dependencies**: B008, B009
> **Estimated Effort**: Medium

## Context
The `scoutWorker` is the operational heart of the automation system. It's responsible for launching Puppeteer, hashing content, and calling the `GeminiService`. Currently, it has no concept of the new `CALENDAR` and `DRINKS` targets and fails to pass the venue owner's `extractionNotes` to the AI.

## Reasoning & Justification
- **Modern Architecture:** By focusing on the `scout/` functions, we align with the production scraper strategy (PubSub + Cloud Run).
- **Context Preservation:** Failing to pass `extractionNotes` nullifies the work done in the UI. This bead connects the "Rules" (UI) to the "Brain" (Gemini).
- **Data Safety:** Correct routing ensures that drink lists don't accidentally get saved as "Events," which would clutter the user's calendar with invalid data.

## Goals
1.  **Context Delivery:** Pass `extractionNotes` from the `ScraperSource` to the `analyzeScrapedContent` call.
2.  **Target Routing:** Implement logic to route `CALENDAR` data to `league_events` and `DRINKS` data to `ai_draft_profile`.
3.  **Persistence Integrity:** Update hashes and `lastScraped` timestamps for all new target types.

## Implementation Details

### 1. Scout Worker Refactor
- [ ] Modify `functions/src/scout/index.ts`:
    - Extract `extractionNotes` from the source object.
    - Pass `extractionNotes` to `gemini.analyzeScrapedContent`.
    - Map `CALENDAR` to `EVENTS` logic and `DRINKS` to `MENU` logic for persistence routing.

### 2. Data Sinking
- [ ] Implement the `DRINKS` sink:
    - Update `ai_draft_profile.menu_highlights` on the venue document.
    - Merge existing highlights to prevent overwriting manual edits (Safety first).

### 3. Error Handling
- [ ] Improve error reporting in the worker so that owner rules that lead to empty extractions (e.g., "Exclude everything") are reported as "Instruction Filtered" rather than "Scrape Error."

## Acceptance Criteria
- [ ] Scout worker runs without crashing for all 6 targets.
- [ ] `lastScraped` timestamp updates correctly for `CALENDAR` and `DRINKS`.
- [ ] Logs show extraction notes being passed to Gemini.
