---
status: done
agent: AGV1
type: feature
priority: medium
created: 2026-01-25
tags: [admin, qr, physical]
---

# Bead: [Tab 9] QR Assets & Vibe Tools

## Objective

Provide the downloadable assets for physical venue deployment (Vibe Check QRs).

## Requirements

- **QR Generator:** Generate a static QR code pointing to `olybars.com/check-in?v={venueId}`.
- **Visual Styles:** Offer "Dark Mode" (Black/Gold) and "Light Mode" (White/Black) variants for printing.
- **Placement Guide:** A simple textual guide or tooltip on where to put them (e.g., "By the register", "On tables").

## Context

- **Spec:** Tab [9] Schema in `docs/specs/Brew_House_Specifications.md`
- **Output:** PNG Download button (using a canvas-to-blob helper).
