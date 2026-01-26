---
status: done
agent: B8Z1
type: feature
priority: medium
created: 2026-01-26
---

# Bead: Localhost Stability & Verification

## Context
After internal identifier and lifecycle fixes, the development stack must be verified to ensure "The Brew House" and "Buzz Feed" are correctly rendering for the primary user (`ryan@amaspc.com`).

## Reasoning & Goal
"The Pulse" of the development environment must be steady. We need a clean start to ensure all changes in `BuzzScreen.tsx` and `App.tsx` are correctly hot-reloaded and served.

## Acceptance Criteria
- [ ] Kill all processes on ports 3000, 3001, 8080.
- [ ] Run `npm run dev:all`.
- [ ] Verify `BuzzScreen` renders without build errors.
- [ ] Verify `The Brew House` (/owner) is accessible without "Access Denied" for the admin user.

## Dependencies
- `bead-20260126-fix-buzzscreen-identifier`
- `bead-20260126-fix-auth-race-condition`

## Resources
- Workflow: `/restore-dev`
- Workflow: `/vibe-coding`
