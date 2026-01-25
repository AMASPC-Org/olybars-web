---
status: Complete
notes: Fixed Export/Import mismatch in MarketingTab. Verified by User.
notes: Fixed TS export issue and cleaned up imports. Growth tab functioning.
type: feature
priority: high
created: 2026-01-24
tags: [marketing, ai, flashbounty]
---

# Bead: [Tab 3] Marketing & Schmidt Briefing

## Objective

Create the growth engine UI for managing Flash Bounties and viewing AI insights from Schmidt.

## Requirements

- **Schmidt Briefing:** Render markdown insights from the `briefing` field. Component should feel like a "Coach's Report."
- **Bounty Scheduler:** Form to create `VenueMarketingBounty` with multiplier, dates, and budget cap.
- **Gallery Manager:** Simple view of `isVisible: true` photos with a high-speed delete/hide button.

## Context

- **Spec:** Tab [3] Schema in `docs/specs/Brew_House_Specifications.md`
- **Persona:** Schmidt (Coach for Partners).
