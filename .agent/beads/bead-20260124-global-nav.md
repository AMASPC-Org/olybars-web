---
status: Complete
agent: N7V2 (Finalized)
type: ui
priority: high
created: 2026-01-24
tags: [ui, navigation, ux]
---

# Bead: Global Horizontal Navigation

## Objective

Implement a unified, scrolling "Bottom Navigation Bar" for all user personas (Visitor, Guest, Owner, Admin).

## Requirements

- **Interactive Scroll:** Horizontal scroll container with NO visible scrollbar.
- **Hover/Swipe:** Mouse drag-to-scroll (desktop) or Swipe (mobile).
- **Active State:** Highlight the current module with the "Golden/Yellow" accent (as seen in mockup).
- **Responsive:** Must handle 5 items (Mobile) up to 12+ items (Owner Dashboard) gracefully.

## Context

- **Files:** `src/features/owner/screens/OwnerDashboardScreen.tsx` (Update the bottom bar), `src/components/layout/AppShell.tsx` (Update main app nav).
- **Mockup:** Refer to `uploaded_media_1` for style reference.
