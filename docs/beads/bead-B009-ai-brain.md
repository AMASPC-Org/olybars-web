# Bead: AI Brain Expansion (B009)

> "The Intelligence Layer"

## Status
- [x] **Complete**
- [x] **Closed**
- [x] **Locked** (2026-01-27)

## Objective
Enhance the `GeminiService` to support specialized extraction logic for diverse venue data source types (`DRINKS`, `CALENDAR`, `WEBSITE`, `SOCIAL_FEED`).

## Specification
- **Drinks Prompt:** Extract draft lists, distinct cocktails, and happy hour specials. Deduplicate against existing data.
- **Calendar Prompt:** Parse recurring vs one-off events. Standardize dates to ISO-8601.
- **Social Feed Prompt:** Classify posts as `EVENT`, `MENU_UPDATE`, `GENERAL_VIBE`, or `NEWS`.
- **Owner Rules:** Inject `extractionNotes` into the system prompt to guide the AI (e.g., "Ignore the lunch menu").

## Deliverables
- [x] `server/src/services/geminiService.ts`: Specialized prompts for all targets.
- [x] `functions/src/services/geminiService.ts`: Parity implementation for cloud functions.
- [x] `functions/src/scout/index.ts`: Passing `extractionNotes` to the AI.

## Verification
- Verified via `Fresh Eyes Audit` (2026-01-27).
- Syntax and Logic checks passed.
