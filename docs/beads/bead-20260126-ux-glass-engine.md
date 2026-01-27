# Bead: UX - The Glass Engine (CSS Foundations)

**ID:** `bead-20260126-ux-glass-engine`
**Status:** Approved for Execution
**Type:** Design System / CSS
**Priority:** Critical (Foundation)

---

## 1. Objective
Replace the flat "Slate-900" aesthetic with a **Cinematic Glassmorphism** system. The app should feel like a piece of high-end hardware (e.g., an obsidian slab) rather than a website.

## 2. Background & Reasoning
*   **Problem:** Solid backgrounds feel "dead" in consumer apps.
*   **Solution:** Use Depth, Blur, and Noise.
*   **Constraint:** Mobile performance. Heavy blurs (`blur-xl`, `blur-3xl`) kill frame rates on budget Android devices.

## 3. Implementation Plan

### 3.1 The Gradient Foundation
*   [ ] **Update `index.css`**:
    *   Replace flat background with a subtle **Radial Spotlights**:
        `background: radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 120%);`
    *   *Why?* Simulates a top-down spotlight (the user's face illuminating the screen).

### 3.2 The "Frosted" Token System (Smart Glass)
*   [ ] **Refactor `tailwind.config.js`**:
    *   `colors.glass-surface`: `rgba(30, 41, 59, 0.7)` (Slate-800 @ 70%).
    *   `colors.glass-border`: `rgba(255, 255, 255, 0.08)`.
*   [ ] **Create Utility `.glass-panel`**:
    *   `@apply bg-glass-surface backdrop-blur-md border border-glass-border shadow-2xl;`
    *   *Optimization*: Use `backdrop-blur-md` (12px) instead of `xl` for better performance/visual ratio.
*   [ ] **Refine `.bg-noise`**:
    *   Set `opacity-[0.03]` (3%) instead of 5% (too grainy).
    *   Ensure `pointer-events-none fixed inset-0 z-0`.

### 3.3 The "Low Power" Fallback
*   [ ] **CSS Guard**:
    *   `@supports not (backdrop-filter: blur(1))` -> Fallback to `bg-slate-900` (95% opacity) to ensure legibility on old browsers.

## 4. Considerations
*   **Contrast**: Text on glass must be legible. Always assume the background *could* be light in a glitch scenario, so stick to high-contrast white text.
