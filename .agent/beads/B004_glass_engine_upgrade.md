# Bead: B004 - The Glass Engine Upgrade

> **Status**: Done
> **Priority**: High
> **Type**: Design System / CSS
> **Estimated Effort**: Low (Foundational)
> **Pre-requisites**: None (modifies `index.css`)

## The Vision: "Digital Luxury"
OlyBars isn't just a utility app; it's a "Nightlife Operating System." It should feel like it's running on a piece of high-end hardware, not a web browser. We achieve this through "Glassmorphism" — creating depth, light, and transparency.

## Context & Problem
We currently have a basic `.glass-panel` utility, but our Input fields and Social Login buttons are "Flat Opaque" (White/Blue).
- **The Clash**: Placing a `bg-slate-100` (bright white) input on top of a `bg-black/60` (dark glass) modal creates a jarring "Admin Panel" look that breaks immersion.
- **The Goal**: Inputs and secondary buttons should feel like they are *etched* into the glass or sitting *behind* a frosted layer.

## Implementation Details

### 1. The "Deep Glass" Input
Create a reusable CSS utility (or Tailwind component) for `.glass-input`:
- **Background**: `bg-black/50` (Dark, semi-transparent).
- **Border**: `border border-white/10` (Subtle etching).
- **Text**: `text-white font-bold`.
- **Placeholder**: `placeholder:text-white/20` (Barely there).
- **Focus State**: `focus:border-primary/50 focus:bg-black/70 focus:outline-none focus:ring-1 focus:ring-primary/50` (Illuminate on activation).
- **Error State (`.glass-input-error`)**: `border-red-500/50 bg-red-900/10 focus:border-red-500 focus:ring-red-500/20`. *Critical for form feedback.*

### 2. The "Ghost Glass" Social Button
Refine Social Login buttons to merge with the environment:
- **Base**: `bg-white/5` (Barely visible shim).
- **Border**: `border border-white/10`.
- **Hover**: `hover:bg-white/10` (Light up).
- **Content**: Keep the Brand Logos (Google 'G', Facebook 'f') full color for trust, but remove the heavy background fills.

## Future Self Notes
- **Contrast Check**: Ensure the generic white text on `bg-black/50` passes WCAG AA.
- **Autofill**: Browser autofill often forces a yellow/blue background. Use `box-shadow: 0 0 0 30px #000 inset` hack if necessary to preserve the dark theme.
