---
id: bead-20260124-bh-backroom-photos
title: Back Room Photo Management
status: done
assignee: antigravity
type: feature
priority: high
created_at: 2026-01-24
---

# Back Room Photo Management

## Objective

Implement photo management for private spaces in the Back Room (Tab 11) to align with the Master Specifications.

## Requirements

1.  **Schema Update**: Ensure `VenuePrivateSpace` interface includes `photos: string[]`. (Already in `Brew_House_Specifications.md`, check `types/venue.ts`).
2.  **UI Implementation**:
    - Add input field for Photo URLs in the "Add New Space" form.
    - Support adding multiple photo URLs.
    - Display photos (carousel or grid) in the Space Card.
3.  **Data Persistence**: Ensure photos are saved correctly to Firestore via `VenueOpsService`.
4.  **Linting**: Ensure no new lint errors are introduced.

## Verification

- Can add a space with photo URLs?
- Do photos render in the card?
- Do changes persist on refresh?
