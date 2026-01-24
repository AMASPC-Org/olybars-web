---
status: open
type: feature
priority: low
created: 2026-01-24
tags: [automation, scrapers]
---

# Bead: [Tab 12] Scrapers & Sync Status

## Objective

Implement the transparency log and manual trigger for automated data ingestion.

## Requirements

- **Sync Status:** Display last synced source (IG, FB, Web).
- **Manual Trigger:** Rate-limited button (1/24h) to force a re-scrape.
- **Sync Rules:** Enforce checking the `isLocked` flag on the venue document.

## Context

- **Spec:** Tab [12] Schema in `docs/specs/Brew_House_Specifications.md`
