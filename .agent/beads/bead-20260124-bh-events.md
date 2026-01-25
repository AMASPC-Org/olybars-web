---
status: Complete
agent: FE01
type: feature
priority: high
created: 2026-01-24
completed: 2026-01-24
tags: [events, calendar, ai]
---

# Bead: [Tab 4] Events & AI Polishing

## Objective

Build the schedule manager for venue events (both recurring and one-time highlights).

## Requirements

- **Calendar Logic:** Handle weekly vs one-time events in Firestore.
- **Schmidt Polish:** Button to call `/api/ai/polish-event` for content optimization.
- **Special Gating:** Ensure "Special" events have distinct visual tagging.

## Context

- **Spec:** Tab [4] Schema in `docs/specs/Brew_House_Specifications.md`
- **Constraint:** Conflict handling for overlapping "Special" events.
