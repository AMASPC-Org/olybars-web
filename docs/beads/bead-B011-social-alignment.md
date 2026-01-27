# Bead: Social Service Alignment (B011)

> "The Social Sentinel"

## Status
- [x] **Complete**
- [x] **Closed**
- [x] **Locked** (2026-01-27)

## Objective
Replace legacy keyword-based scraping with AI-driven classification for social media feeds, enabling automated draft creation for events and news.

## Specification
- **Input:** Raw JSON from Meta Graph API (or scraping fallback).
- **Processing:** `GeminiService.analyzeScrapedContent` with `SOCIAL_FEED` target.
- **Output:**
    - `EVENT` -> Create `EventDraft` in Firestore.
    - `MENU/NEWS` -> Create `GeneralDraft` in Firestore.
    - `GENERAL_VIBE` -> Log sentiment/vibe keywords.

## Deliverables
- [x] `server/src/services/SocialManager.ts`: Integrated `GeminiService` for post analysis.
- [x] `server/src/services/SocialManager.ts`: Implemented `createEventDraft` and `createGeneralDraft`.
- [x] `server/src/services/SocialManager.ts`: Added defensive error handling for Meta API.

## Verification
- Verified via `Fresh Eyes Audit` (2026-01-27).
- ensured `response.ok` checks for external API calls.
