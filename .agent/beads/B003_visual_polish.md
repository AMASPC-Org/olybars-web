# Bead: B003 - "Stripe-Level" UX Polish

> **Status**: In Progress
> **Priority**: Medium
> **Type**: UX/UI
> **Dependencies**: B001 (Requires clean component isolation)

## Context
"Stripe-level" quality is defined by:
1.  **Intentional Typography**: hierarchy is clear, spacing is consistent.
2.  **Micro-interactions**: buttons feel "physical" (active states), transitions are fluid.
3.  **Depth**: Use of blur, shadow, and layering to create "Premium" feel.
4.  **Empty States**: Never show a blank screen. Show a helpful, branded state.

## Goals
1.  **Global Depth System**: Standardize our "Glass" effect (`backdrop-blur-xl`, `border-white/10`, `shadow-2xl`).
2.  **Interaction Audit**: Add `active:scale-95` and `transition-all` to ALL primary actions.
    *   *A11y*: Must include `motion-reduce:transform-none` to respect OS accessibility settings.
3.  **Loading/Empty Polish**: Replace generic spinners with branded "Pulse" animations or Skeleton loaders where appropriate.

## Implementation Details
1.  **`index.css`**: Define utility class `.glass-panel` for consistent reuse.
2.  **Refine `InfoPopup` (from B001)**: Add entry animation (Scale 0.95 -> 1.0, Opacity 0 -> 1).
3.  **Sidebar**: Enhance the "Player Card" and "Owner Header" with subtle noise texture overlay and better spacing.
4.  **AppHeader**: Ensure the "Buzzing" state (red pulses) feels sophisticated, not alarming.

## Acceptance Criteria
- [ ] All modals use the new `.glass-panel` utility.
- [ ] Primary buttons have tactile feedback (scale/color).
- [ ] No "Layout Shift" (CLS) during loading states if possible.
