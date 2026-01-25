# Bead: Build Events Management Tab

**ID:** bead-20260124-bh-events-tab
**Status:** Completed
**Tactic:** Feature Build

## Objective

Implement the "Events" tab in the Brew House (Owner Dashboard) to allow venue owners to manage their calendar manually.

## Context

Owners need a way to populate the OlyBars feed. While we have scrappers planned, manual entry is the fallback and "Gold Standard" for accuracy.

## Execution Plan

1.  **Frontend**: Create `src/features/owner/components/EventsManagementTab.tsx`.
    - **List View**: Upcoming events (sorted by date).
    - **Add/Edit Modal**: Form for Title, Date/Time, Description, Type (Karaoke, Trivia, Live Music), and Cover Charge.
    - **Action**: Delete/Cancel event.
2.  **Backend Integration**: Update `venueService.ts`.
    - `createVenueEvent(venueId, eventData)`
    - `updateVenueEvent(venueId, eventId, eventData)`
    - `deleteVenueEvent(venueId, eventId)`
3.  **Schema**: Ensure simplified Event schema matches `src/types/index.ts`.
    - Note: Need to ensure `startTime` and `endTime` are Timestamps.

## Design

- Use "Calendar Card" aesthetic.
- "Quick Templates" for recurring events (e.g. "Taco Tuesday").
