---
status: done
agent: C1T0
type: feature
priority: high
created: 2026-01-24
tags: [listing, maps, settings]
---

# Bead: [Tab 5] Listing & Google Lock Control

## Objective

Build the "Digital Storefront" management UI where owners control their Google-synced metadata and fulfillment links.

## Requirements

- **Google Lock Logic:** Implement the `isLocked` boolean. Any manual edit to hours or contact data MUST set `isLocked: true` to prevent scraper overwrites.
- **Fulfillment Manager:** UI to manage 3rd-party links (DoorDash, Toast, etc.).
- **Hours Editor:** A robust daily hours editor that updates the core venue document.
- **Geocode Trigger:** Ensure address changes trigger the existing coordinate re-sync logic.

## Context

- **Spec:** Tab [5] Schema in `docs/specs/Brew_House_Specifications.md`
- **Data Anchor:** Must align with `venues_master.json` rules defined in `ops-and-discovery.md`.
