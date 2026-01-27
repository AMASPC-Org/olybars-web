# Bead: Scraper UI & Logic (B012/B013)

> "The Control Center"

## Status
- [x] **Complete**
- [x] **Closed**
- [x] **Locked** (2026-01-27)

## Objective
Provide Venue Owners with a granular, intuitive interface to manage multiple scraper targets and provide specific instructions to the AI.

## Specification
- **Add Source Modal:** Support `EVENTS`, `MENU`, `DRINKS`, `CALENDAR`, `WEBSITE`, `SOCIAL_FEED`.
- **Instruction Field:** Universal `extractionNotes` input with dynamic placeholders based on target.
- **Visuals:** Target-specific icons and rule preview in `ConnectSourceCard`.
- **Validation:** Ensure URL and Frequency are populated.

## Deliverables
- [x] `src/features/owner/components/scraper/AddSourceModal.tsx`: Updated targets and instruction logic.
- [x] `src/features/owner/components/scraper/ConnectSourceCard.tsx`: Added icons and rule display.
- [x] `src/features/owner/components/ScraperManagementTab.tsx`: Wired up `extractionMode` mapping.

## Verification
- Verified via `Walkthrough` (2026-01-27).
- Manual verification of UI responsiveness and state updates.
