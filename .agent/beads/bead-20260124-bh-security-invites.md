---
id: bead-20260124-bh-security-invites
title: Invitation Security Hardening
status: Complete
agent: Antigravity
type: security
priority: high
created: 2026-01-24
---

# Bead: Invitation Security Hardening

## Objective

Enforce strict access control on the `invites` subcollection in Firestore.

## Requirements

1. Update `firestore.rules`.
2. Path: `/venues/{venueId}/invites/{inviteId}`.
3. **Create/Delete**: Only Owners of `venueId`.
4. **List**: Only Owners.
5. **Read**: Restricted to specific token queries or Owners.

## Context

- `docs/beads/bead-20260124-bh-security-invites.md`
