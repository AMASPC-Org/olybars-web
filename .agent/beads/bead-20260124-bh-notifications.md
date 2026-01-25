---
status: Complete
agent: CTO1
type: feature
priority: critical
created: 2026-01-24
tags: [backend, frontend, notifications]
---

# Bead: [Tab 1] Notifications & Approval Engine

## Objective

Build the "Command Center" that monitors venue-specific notifications including photo approvals, guest event submissions, and system alerts.

## Requirements

- **Firestore Listener:** Implement `onSnapshot` on `venues/{venueId}/notifications`.
- **Approval Logic:** Component to Approve/Reject items.
- **Action Trigger:** Approving a photo must trigger the update to the public gallery.
- **Missing Items:** Support for "Holidays" and "Guest Event Submissions" notification types.
- **SuperAdmin Dispatch:** Add logic to notify `ryan@amaspc.com` when a venue adds an event.

## Context

- **Spec:** Tab [1] Schema in `docs/specs/Brew_House_Specifications.md`
- **Types:** `src/types/owner.ts` -> `VenueNotification`
