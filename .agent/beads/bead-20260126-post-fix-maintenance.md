---
status: done
agent: B8Z1
type: maintenance
priority: high
created: 2026-01-26
---

# Bead: BuzzScreen & App Sanitization

## Context
During the platform stability audit, we identified that `BuzzScreen.tsx` is in a partially broken state regarding the `VenueMap` component, which is used but not imported. Additionally, both `BuzzScreen.tsx` and `App.tsx` have accumulated significant lint warnings (30+ unused imports/variables) which clutter the codebase and increase build overhead.

## Reasoning & Goal
Cleaning up these issues ensures that the "Nightlife Operating System" remains maintainable and that "The Pulse" (VenueMap) actually functions when the user switches to Map View. This follows our core goal of **Visual Integrity** and **Code Standards**.

## Acceptance Criteria
- [ ] **Fix Missing Import**: Add `import { VenueMap } from "../components/VenueMap";` to `BuzzScreen.tsx`.
- [ ] **Sanitize BuzzScreen Imports**: Remove all 20+ unused imports (e.g., `Star`, `Users`, `Trophy`, `Search`, `Filter`, `Bot`, `Gamepad2`, `ShieldCheck`, `List`, `MapIcon`, `TAXONOMY_PLAY`, `TAXONOMY_FEATURES`, `DiscoveryLayout`).
- [ ] **Sanitize App.tsx Imports**: Remove unused `useLocation`, `useSearchParams`, `QueryClientProvider`, `FirebaseUser`, `ActivityLog`, `syncClockIns`, `fetchRecentActivity`.
- [ ] **Verification**: `npm run build` succeeds and Map View in `BuzzScreen` is verified to render (simulated or code-verify).

## Dependencies
- None

## Resources
- File: `src/features/venues/screens/BuzzScreen.tsx`
- File: `src/App.tsx`
