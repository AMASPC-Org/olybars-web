# Bead: Build Operations "Pulse" Tab

**ID:** bead-20260124-bh-ops-tab
**Status:** Open
**Tactic:** Feature Build

## Objective

Implement the "Operations" tab (The Pulse) for real-time venue control.

## Context

This is the "Mission Control" screen where owners/managers interact with the system live during service.

## Execution Plan

1.  **Frontend**: Create `src/features/owner/components/OperationsTab.tsx`.
    - **Vibe Check Override**: 4-button selector (Trickle, Flowing, Gushing, Flooded).
      - Visual feedback: Pulse animation.
    - **Live Headcount**: "+ / -" Stepper for manual adjustments.
    - **Game Status**: Toggles for Pool, Darts, Karaoke (Active/Inactive).
2.  **Backend Integration**:
    - Function: `updateVenueLiveStatus(venueId, statusData)`.
    - Path: `venues/{venueId}/status/live` (Singleton).
3.  **Real-time**:
    - Use `onSnapshot` to reflect changes immediately across devices (e.g., Door guy updates count, Bar manager sees it).

## Logic

- **TTL**: Updates should ideally have an expiration (handled by Cloud Functions normally), but for frontend, we just write the timestamp `vibeStatusExpiresAt`.
