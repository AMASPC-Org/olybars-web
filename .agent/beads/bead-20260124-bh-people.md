---
status: open
type: feature
priority: high
created: 2026-01-24
tags: [auth, security, people]
---

# Bead: [Tab 7] People & Invite System

## Objective

Implement secure access control and staff invitation management.

## Requirements

- **Secure Invites:** Generate `VenueInvite` tokens with 48h TTL.
- **Role Limits:** Enforce that only Owners can see/edit this tab.
- **Redundant Sync:** accepted invites must update both `users` and `venues` doc arrays.

## Context

- **Spec:** Tab [7] Schema in `docs/specs/Brew_House_Specifications.md`
