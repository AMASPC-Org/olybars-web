---
id: bead-20260124-bh-join-flow
title: Staff Join Flow
status: Complete
agent: Antigravity
type: feature
priority: high
created: 2026-01-24
---

# Bead: Implement Staff Join Flow

## Objective

Build the "Redemption" page for the invite links sent by Owners.

## Requirements

1. Verify token from URL `?t={token}&v={venueId}`.
2. Build Landing Page for verification (`JoinTeamScreen.tsx`).
3. Implement "Accept" logic to grant permissions.
4. Update `users/{uid}` and `venues/{venueId}` upon acceptance.

## Context

- Path: `/admin/join`
- Logic: `venueService.ts`
