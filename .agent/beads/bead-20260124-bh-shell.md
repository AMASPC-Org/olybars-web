---
status: Complete
agent: AGV1
type: feature
priority: high
created: 2026-01-24
tags: [frontend, layout, brewhouse]
---

# Bead: Brew House Shell & Navigation

## Objective

Implement the main layout for "The Brew House" dashboard with a strict left-to-right prioritization of 12 tabs as defined in the master specs.

## Requirements

- **Layout:** Sidebar or Tab-strip following the horizontal priority (Notifications -> Operations -> Marketing -> Events etc.).
- **Responsiveness:** Must be "Drunk Thumb" compliant. Large touch targets, highly mobile-responsive.
- **Routing:** Use `react-router-dom` to handle sub-routing for each tab (e.g., `/admin/brewhouse/operations`).
- **Gating:** Ensure base `/admin/brewhouse` route requires at least `staff` role in `venuePermissions`.

## Context

- **Spec:** `docs/specs/Brew_House_Specifications.md`
- **Existing Code:** Check `src/components/dashboard/` for any legacy shells to merge/enhance.
