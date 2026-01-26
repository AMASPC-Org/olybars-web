---
status: done
agent: B8Z1
type: bug
priority: critical
created: 2026-01-26
---

# Bead: BuzzScreen Identifier Separation

## Context
Vite/Babel reports `Identifier 'InteractionBase' has already been declared` in `src/features/venues/screens/BuzzScreen.tsx`. This happens even when no second declaration is visible in the source. This is likely due to:
1.  A conflict with a hidden global identifier.
2.  A Babel parser bug caused by invisible characters.
3.  Name shadowing in a complex component structure.

## Reasoning & Goal
To resolve this without "black magic," we will use **Identifier Separation**. By renaming the import to `InteractionBaseComponent`, we ensure uniqueness across all scopes. This is a "Defensive Programming" pattern that makes the codebase more resilient to build-tool quirks.

## Acceptance Criteria
- [ ] **Import Sanitization**: Delete lines 1-65 and re-import all manually (not copy-paste) to ensure no hidden characters or duplicate lines are present.
- [ ] **Identifier Aliasing**: Change the import to `import { InteractionBase as InteractionBaseComponent } from "../../../components/ui/InteractionBase";`.
- [ ] **Component Swap**: Replace all 4 instances of `<InteractionBase` and `</InteractionBase>` with `<InteractionBaseComponent>`.
- [ ] **Pre-build Clean**: Run `npm run clean` (if exists) or delete `node_modules/.vite` to clear Babel cache.
- [ ] **Verification:** `npm run build` succeeds.

## Dependencies
- None

## Resources
- File: `src/features/venues/screens/BuzzScreen.tsx`
- Component: `src/components/ui/InteractionBase.tsx`
