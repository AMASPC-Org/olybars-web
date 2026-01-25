---
status: Complete
type: feature
priority: medium
created: 2026-01-24
tags: [menu, inventory]
---

# Bead: [Tab 6] THE MENU & Inventory Control

## Objective

Build the digital menu management UI with a focus on real-time availability ("86'ing").

## Requirements

- **Inventory List:** Grid/List of items categorized by section (Draft, Food, etc.).
- **86 Engine:** Large, instant-action toggle for `isAvailable`.
- **Redundancy:** Toggling `isAvailable: false` must update the public venue-page instantly.

## Context

- **Spec:** Tab [6] Schema in `docs/specs/Brew_House_Specifications.md` (Uses `VenueMenuItem`)
