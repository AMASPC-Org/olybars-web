---
status: done
agent: H4X0
type: feature
priority: critical
created: 2026-01-24
tags: [frontend, logic, vibe]
---

# Bead: [Tab 2] Operations & Vibe Signal

## Objective

Implement the real-time "Pulse" terminal for venue owners to override system-calculated vibe and headcount.

## Requirements

- **Vibe Terminal:** UI for "Trickle, Flowing, Gushing, Flooded" (LOCKED labels).
- **TTL Logic:** Implement the 45m expiration logic for manual vibes and 60m for headcount buffers.
- **Headcount Adjust:** +/- 5 buttons using the `manualHeadcountBuffer` field.
- **Game Toggles:** Real-time switches for Pool, Darts, etc.
- **Singleton Pattern:** Ensure all writes hit `venues/{venueId}/status/live`.

## Context

- **Spec:** Tab [2] Schema in `docs/specs/Brew_House_Specifications.md`
- **Existing Component:** Enhance `src/features/owner/components/OperationsTab.tsx`.
