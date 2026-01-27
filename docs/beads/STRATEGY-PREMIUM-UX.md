# Strategy: THE VIBE CODING OVERHAUL (Premium UX)

## Goal
Elevate OlyBars from "Functional Utility" to "Digital Luxury". The app should feel like a premium "Nightlife OS"—slick, responsive, and visually immersive.

## Core Philosophy: "Dark Mode Quintessence"
We are building for low-light environments (bars, clubs). The UI must be:
1.  **High Contrast but Low Glare**: Avoid pure white (#FFFFFF) text on pure black. Use off-whites and slate-grays.
2.  **Tactile**: Buttons should feel "pressable". Lists should feel "scrollable".
3.  **Depth**: Use layered shadows and blurs, not just borders, to define hierarchy.

## The "Bead" Breakdown

### Bead A: THE GLASS ENGINE (Foundation)
*   **Refactor `index.css`**:
    *   Replace `bg-black` with rich gradients (`bg-gradient-to-b from-slate-900 to-black`).
    *   Refine `.bg-noise` to be less grainy, more cinematic.
    *   Introduce `backdrop-blur-xl` + `bg-white/5` tokens for a consistent "Frosted Glass" system.

### Bead B: THE KINETIC INTERFACE (Motion)
*   **Sidebar Animation**:
    *   Replace the rigid `translate` transition with a cubic-bezier curve that feels "heavy" and premium.
    *   Add "Staggered Entry" for list items (they should slide in one by one).
*   **Button Physics**:
    *   Standardize `active:scale-95` to a more fluid `transform scale-[0.98] transition-all duration-75`.
    *   Add "Glow on Hover" for primary actions.

### Bead C: TYPOGRAPHY TUNING (Readability)
*   **Audit "Font Black"**: It's overused. Reserve `font-black` for headers > 24px.
*   **Body Text**: Switch to `font-medium` or `font-normal` (Roboto Condensed) for better readability in lists.
*   **Tracking**: Increase `tracking-widest` for small overlines (labels) but reduce it for main headings to make them punchier ("tight").

### Bead D: THE SKELETON CREW (Loading States)
*   **Replace Spinners**: A spinning circle is "computer work". A shimmering skeleton is "content loading".
*   **Implementation**: Create a reusable `<Skeleton />` component that matches our glass aesthetic (shimmering white/5).

### Bead E: COMPONENT POLISH (Targeted Fixes)
*   **AppShell**: Soften the `border-x-4` on desktop. Make it look like a floating phone mock.
*   **TriviaScreen**: The "Quick Search" grid needs icons or images, not just text.
*   **Sidebar**: The "User Card" header needs to look like a VIP pass (holographic effect?).

## Execution Order
1.  **Glass Engine** (Global CSS)
2.  **Typography Tuning** (Global search/replace on classes)
3.  **Kinetic Interface** (Layout/Sidebar)
4.  **Component Polish** (Screen by screen)
