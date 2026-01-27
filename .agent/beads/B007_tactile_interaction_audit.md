# Bead: B007 - Tactile Interaction Audit

> **Status**: Done
> **Priority**: Low (Polish)
> **Type**: Global UX Audit
> **Dependencies**: None

## The Vision: "No Dead Clicks"
Every tap should receive an immediate physical response. In the physical world, button presses have resistance and travel. In digital (especially Swipe/Tap interfaces), we simulate this with `scale` transforms. This creates the illusion of "Juice".

## Context & Problem
Many buttons in OlyBars were built functionally (`onClick={doThing}`) but lack the class `active:scale-95`. This makes the app feel "stiff" or "laggy" because the UI doesn't visually acknowledge the finger press until the JS event fires.

## The Mandate
Conduct a file-by-file audit of `src/features/` and ensure **EVERY** `<button>` tag that represents a primary interaction has:
1.  `active:scale-95` for **Action Buttons** (CTA, Icon Buttons, Links).
    - *Exception*: **Navigation Tabs** or **Large Cards** should use `active:scale-[0.98]` or color shifts only. Scaling large areas > 95% causes "Motion Sickness" and layout thrashing.
2.  `transition-all` (The Smoothness).
3.  `duration-200` (The Snap).

## Specific Targets
1.  **Modals**: Close buttons (`X`) often get missed. They should scale down or rotate on press.
2.  **Toggle Switches**: The Marketing Consent toggle in `VibeCheckModal`.
3.  **List Items**: Use `active:scale-[0.98]` (subtler) for large list items (like Venue Cards) to prevent motion sickness.

## Automated Strategy (Grep)
- Search for `<button` that does NOT contain `active:`.
- Apply the fix.
