# Bead: B001 - Core Architecture & State Refactor

> **Status**: Done
> **Priority**: Critical
> **Type**: Architecture
> **Dependencies**: None
> **Estimated Effort**: High

## Context
`App.tsx` is currently a "God Component" handling routing, UI layout, AND complex gamification state (Points, Clock-ins, Vibe Checks). This creates unnecessary re-renders and makes the code fragile. To achieve a professional architecture, we must separate *State* from *View*.

## Goals
1.  **Extract Gamification State**: Move `userPoints`, `clockInHistory`, `vibeCheckHistory` and their associated logic (`awardPoints`, `handleClockIn`, `confirmVibeCheck`) into a new `GamificationContext`.
2.  **Extract UI Components**: Move `InfoPopup` and `SmartOwnerRoute` to dedicated files.
3.  **Clean App.tsx**: It should primarily handle Routing and Context Providers, acting as the clean "manifest" of the app.

## Implementation Details
1.  **Create `src/contexts/GamificationContext.tsx`**:
    - Port all points/activity logic here.
    - Expose hook `useGamification()`.
2.  **Extract Components**:
    - `src/components/ui/InfoPopup.tsx` (Premium Glass style).
    - `src/features/owner/routes/SmartOwnerRoute.tsx` (Logic isolation).
3.  **Refactor `App.tsx`**:
    - Wrap application in `<GamificationProvider>`.
    - Replace local state references with `useGamification()`.

## Acceptance Criteria
- [ ] `App.tsx` is < 400 lines (currently 1400+).
- [ ] No logic changes—refactoring only. Points system works exactly as before.
- [ ] UI components (`InfoPopup`) are standalone and reusable.
