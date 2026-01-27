# Bead: B002 - Schmidt Ops Logic Integrity

> **Status**: Done
> **Priority**: High
> **Type**: Bug Fix & Stability
> **Dependencies**: None

## Context
The `useSchmidtOps.ts` hook has a "happy path" bias, using `mockVenue` for critical scheduling checks. It also lacks robust error handling for network states. To be "Operationally Realistic" (Project Core Value), it must handle real-world data and failure states gracefully.

## Goals
1.  **Real Data Integration**: Remove `mockVenue`. Force the hook to use `venue` from `VenueOpsService` or Context.
2.  **Guard Rails**: Disable operations (return "Unavailable") if the venue context is not fully loaded.
3.  **Feedback**: Provide clear UI feedback if a validator fails due to missing data (vs. invalid input).

## Implementation Details
1.  **Refactor `validateSchedule`**:
    - Signature: `(timeISO: string, duration: number, venueContext: Venue) => Promise<Result>`.
    - Logic: If `venueContext` is missing, throw tangible error "Venue Data Not Ready".
2.  **Hook Update**:
    - In `useSchmidtOps`, ensure `venue` state is checked before calling validators.
3.  **Safe Failover**:
    - If Firestore fails, degrade gracefully to "Standard Rules" but warn the user.

## Acceptance Criteria
- [ ] `mockVenue` deleted.
- [ ] Scheduling invalid times triggers a REAL error message from the engine.
- [ ] No "undefined" crashes when opening Schmidt Ops immediately on load.
