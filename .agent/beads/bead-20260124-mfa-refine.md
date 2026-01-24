---
status: done
agent: AGV1
type: security
priority: critical
created: 2026-01-24
tags: [admin, mfa, auth]
---

# Bead: MFA Refinement & Bypass

## Objective

Restore Multi-Factor Authentication (MFA) enforcement for Venue Owners while hard-coding a "Super Admin Bypass" for `ryan@amaspc.com` (CTO/System Owner).

## Requirements

- **Super Admin Bypass:** If `isSystemAdmin(userProfile)` is true, skip all MFA checks.
- **Owner Enforcement:** If a user is a venue manager/owner and NOT a system admin, they MUST be enrolled in MFA to access the dashboard.
- **Auth Guard:** Re-enable the redirect logic in `SmartOwnerRoute` (App.tsx) that sends unauthorized users to the portal.
- **Cleanup:** Remove debug comments and unused imports.

## Context

- **File:** `src/features/owner/screens/OwnerDashboardScreen.tsx`
- **File:** `src/App.tsx` (SmartOwnerRoute)
- **Logic:** `MfaService.isEnrolled(currentUser)`
