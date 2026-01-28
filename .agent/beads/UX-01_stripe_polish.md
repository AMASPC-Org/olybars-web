# Bead: UX-01 - Stripe-Level Polish & Micro-Interactions

> **Status**: OPEN
> **Priority**: High (P1)
> **Type**: UX / Polish
> **Dependencies**: ARCH-02 (Stable Shell recommended first)

## Context
The app functions but lacks the "Wow" factor. The user demanded "Stripe-level" quality.
1.  **Transitions**: Route changes are abrupt.
2.  **Feedback**: Buttons lack tactile weight.
3.  **Loading**: Spinners are generic; we need skeletons that match the layout.
4.  **Glass**: Some panels are too opaque or lack the "etched" border effect.

## Goals
1.  **Fluidity**: Implement `framer-motion` (using `LazyMotion` to minimize bundle impact).
2.  **Tactility**: Every interactive element must scale/glow on press.
3.  **Perception**: Use "Shimmer Skeletons" to make loading feel faster.
4.  **Retention**: **Scroll Restoration** must be perfect. Hitting "Back" from a venue returns to the exact scroll position in the list.

## Implementation Details

### 1. `src/components/ui/PageTransition.tsx` (NEW)
*   **Action**: Create a wrapper using `<motion.div>` with a standardized "Fade + Slide Up" variant.
*   **Usage**: Wrap page content in `VenuesScreen`, `VenueProfileScreen`.

### 2. `src/index.css` (POLISH)
*   **Action**:
    *   Refine `.glass-panel` to use multiple shadows (ambient + direct).
    *   Add `.active-press`: `@apply active:scale-[0.98] transition-transform duration-100`.

### 3. `src/components/ui/Skeleton.tsx` (UPGRADE)
*   **Action**:
    *   Replace basic pulse with a "Shimmer Sweep" animation (CSS based for performance).
    *   Create `VenueCardSkeleton` and `ProfileSkeleton` specifically.

### 4. Component Audit
*   **Badge**: Add "pop" animation on mount.
*   **Toast**: Ensure branded toasts (from `LayoutContext`) have premium entrance animations.

## Task Graph

- [ ] **Step 1: The Foundation**
    - [ ] Install `framer-motion` (check bundle size first).
    - [ ] Create `MotionConfig` in `App.tsx` (once ARCH-02 is done).
- [ ] **Step 2: The Feel**
    - [ ] Add `active-press` class to global CSS.
    - [ ] Apply to `GlassCard`, `Button`, and Navigation items.
- [ ] **Step 3: The Flow**
    - [ ] Implement `PageTransition` component.
    - [ ] Add `<AnimatePresence mode='wait'>` to `AppShell`.
- [ ] **Step 4: The Wait**
    - [ ] Build `VenueCardSkeleton` (matching `GlassCard` layout).
    - [ ] Replace `LoadingSpinner` in `VenuesScreen` with 5x Skeletons.

## Acceptance Criteria
1.  **Tactile**: Clicking ANY button feels "physical" (scale down).
2.  **Smoothness**: Navigating between venues feels connected (not a hard refresh).
3.  **Loading**: User sees structure immediately, not a spinner.
