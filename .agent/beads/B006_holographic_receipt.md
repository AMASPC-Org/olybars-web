# Bead: B006 - The Holographic Receipt

> **Status**: Done
> **Priority**: Medium
> **Type**: Component Polish
> **Dependencies**: B004

## The Vision: "Proof of Vibe"
The Vibe Receipt is the "Trophy" users share on Instagram. It needs to look cool enough that users *want* to be seen sharing it. It shouldn't look like a grocery store receipt; it should look like a Cyberpunk Data Log or a Holographic Ticket.

## Context & Problem
`VibeReceiptModal.tsx` currently uses a hardcoded `bg-slate-950`. While dark, it's flat. The gradient header (`from-primary to-yellow-600`) is good, but the container feels disconnected from the rest of the "Glass" app.

## Implementation Objectives

### 1. Container Upgrade
- **Glass Shell**: Replace `bg-slate-950` with `.glass-panel`.
- **Transparency**: This effectively makes the receipt semi-transparent.
    - **Critical**: Tune the global backdrop opacity. If the parent modal backdrop is `bg-black/90`, the glass effect is invisible. Use `bg-black/60` or `bg-black/80` specifically for this modal to ensure the blurred map underneath is hinted at.

### 2. The "Tear Off" Header
- **Visuals**: Review the "OLYBARS.COM // VIBE RECEIPT" text at the top. Ensure it uses `font-mono` (Typewriter style) or `font-league` to sell the "System Log" aesthetic.

### 3. Share Grid Polish
- **Buttons**: The grid of share icons (Facebook, Insta, Copy) currently has 1px borders.
- **Juice**: Add `active:scale-95` to each icon button.
- **Feedback**: When "Copy Link" is tapped, ensure the `CheckCircle2` success state pops aggressively (e.g., `animate-in zoom-in spin-in-90`).

## Design Philosophy
- **"Artifacts"**: We treat digital items (receipts, cards, tickets) as "Artifacts" that have weight. A glass receipt feels lighter and more modern than a slate block.
