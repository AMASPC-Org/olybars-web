# Bead: Bouncer Logic Migration

**ID:** bead-20260126-bouncer-logic
**Status:** Open
**Owner:** Unassigned
**Dependencies:** bead-20260126-vibe-integrity, bead-20260126-persona-wall

## Context

The gamification economy relies on the integrity of "Clock-ins" and "Vibe Reports." Relying on frontend geofencing or timestamps is inherently bypassable by sophisticated users (or simple proxy tools). 

### The "Superman" Problem
"Teleporting" between bars 5 miles apart in 2 seconds should be rejected.

### The "Camper" Problem
Spamming vibe reports from a single location to farm points should be rate-limited by device ID.

## Objectives

1.  **Authoritative Validation**: Move distance and time checks from `App.tsx` to a Firebase Cloud Function `processUserAction` trigger.
2.  **Device Fingerprinting**: Include a hashed device ID in `signals` to detect "one phone, multiple accounts" farming.
3.  **UI "Soft" Gating**: Retain frontend checks for UX (hiding the button if far away), but acknowledge that the backend is the final arbiter.

## Execution Steps

- [ ] Review `functions/src/triggers` for existing validation logic.
- [ ] Implement "Superman Rule": Calculate distance delta / time delta between successive signals.
- [ ] Implement "Camper Rule": 12h cooldown per venue per device.

## Considerations for Future Self

- **Battery Sensitivity**: Don't poll GPS too frequently on the frontend just for the Bouncer. Use the existing "Clock-In" trigger point.
- **False Positives**: GPS drift in basement bars (The Brotherhood) can trigger the Superman rule. Implement a "Drift Buffer" (e.g., 200m).

## Reference

- [System_Architecture_Master.md: Section 8.4](file:///docs/knowledge/core/system_architecture.md#L138)
- [functions/index.ts](file:///functions/src/index.ts)
