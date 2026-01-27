# Bead: UX - The Kinetic Interface (Motion System)

**ID:** `bead-20260126-ux-kinetic`
**Status:** Approved for Execution
**Type:** Animation / Interaction
**Priority:** High

---

## 1. Objective
Eliminate "Teleportation". Every state change must have transition physics (Mass & Friction).

## 2. Background
*   **Stripe Standard**: UI elements slide in with stagger. Buttons depress with resistance.
*   **Goal**: Make the app feel "heavy" and premium, not "weightless" and cheap.

## 3. Implementation Plan

### 3.1 The Physics Engine (Tailwind Config)
*   [ ] **Define Bezier Curves** in `tailwind.config.js`:
    *   `transitionTimingFunction.spring-bounce`: `cubic-bezier(0.175, 0.885, 0.32, 1.275)` (Overshoot).
    *   `transitionTimingFunction.spring-smooth`: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` (Apple-like).
    *   `transitionDuration.400`: `400ms`.

### 3.2 The Stagger System
*   [ ] **Implement `StaggerContainer.tsx`**:
    *   Props: `delayStep` (e.g., 50ms).
    *   Logic: Clone children and apply `style={{ animationDelay: idx * delayStep + 'ms' }}`.
    *   *CSS Keyframe*: `fade-slide-up` (TranslateY 10px -> 0px, Opacity 0 -> 1).

### 3.3 Tactile Buttons ("The Juice")
*   [ ] **Global Button Standard**:
    *   `active:scale-[0.97] transition-transform duration-100 ease-spring-smooth`.
    *   *Note*: `scale-95` is too jarring. 0.97 is a "click", 0.95 is a "squish".
*   [ ] **Focus Rings**:
    *   Replace default browser focus with `focus-visible:ring-2 focus-visible:ring-primary/50`.

### 3.4 Page Transitions (Router)
*   [ ] **Fade Interstitial**:
    *   Add a simple opacity fade (150ms) on `Outlet` mount to prevent white flashing.

## 4. Considerations
*   **Reduced Motion**: Use `motion-reduce:transition-none` utility to respect accessibility settings.
