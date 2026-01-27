# Bead: UX - Component Polish (Targeted Fixes)

**ID:** `bead-20260126-ux-component-polish`
**Status:** Approved for Execution
**Type:** Implementation
**Priority:** Low (High Impact)

---

## 1. Objective
Apply the new design system to key structural components (Shell, Sidebar, Cards).

## 2. Implementation Plan

### 3.1 AppShell: The "Device Frame" (Desktop)
*   [ ] **Refactor Frame**:
    *   Remove `border-x-4 border-black`.
    *   Add `border border-white/10 rounded-3xl` (if we have padding) or keep square but soften border.
    *   Add **Device Shadow**: `shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]`.
    *   *Goal*: Make the app look like it's floating on the desktop.

### 3.2 Sidebar: The "Holographic" User Card
*   [ ] **Component**: `Sidebar.tsx` header.
*   [ ] **Style**:
    *   Add `bg-gradient-to-br from-slate-800 to-slate-900`.
    *   Overlay a subtle `linear-gradient` that moves on hover (`bg-[length:200%_200%] animate-shimmer`).
    *   *Vibe*: Looks like a premium credit card or VIP pass.

### 3.3 TriviaScreen: Empty States
*   [ ] **Quick Search Grid**:
    *   Add icons (`lucide-react`) behind the text with `opacity-10 -rotate-12 scale-150`.
    *   *Effect*: Visual watermark to break up the gray blobs.

## 4. Considerations
*   **Mobile-First**: The "Device Frame" is DESKTOP ONLY. On mobile (`max-w-md`), the app must occupy the full viewport (no rounded corners, no external shadows).
