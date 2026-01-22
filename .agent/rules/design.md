# Design & UX Standards ("Drunk Thumb")

## 1. The "Drunk Thumb" Protocol
We build for dark bars and distracted users.
- **Touch Targets**: Minimum **44x44px** for all interactive elements.
- **Padding**: Generous padding (min `p-3` or `p-4`) to prevent accidental clicks.
- **Safe Zones**: Important actions (e.g., "Clock In") must be placed in the "Thumb Zone" (bottom half of screen).

## 2. High-Contrast Aesthetics
- **Theme**: Dark Mode First (OlyBars is a nightlife app).
- **Legibility**:
    - Primary Text: `text-white` or `text-slate-100`.
    - Secondary Text: `text-slate-400` (avoid faint grays).
    - Status Indicators: Use vibrant, distinct colors (Neon Green, Hot Pink, Amber) for status; avoid subtle pastel differentiations.

## 3. Mobile-First Responsiveness
- **Layout**: Default to `flex-col` on mobile. `grid-cols-1`.
- **Breakpoints**: Use `md:` and `lg:` sparingly for desktop expansions. The core experience is < 450px width.
