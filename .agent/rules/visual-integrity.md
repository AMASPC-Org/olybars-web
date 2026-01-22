---
trigger:
  type: glob
  pattern: "src/**/*.{tsx,css}"
---

# Visual Integrity & "Face" Verification

This rule ensures that what the Brain (code) logic processes is actually visible and interactive for the User (Face).

## 1. The "Optical Proof" Mandate
Before claiming a UI feature is "Fixed" or "Verified":
- **Screenshot Requirement**: You MUST capture a screenshot of the specific UI component in its active state.
- **Verification Clause**: You must state in your report: "I have verified that element [X] is visually present and not obscured."

## 2. Anti-Clipping Standards
- **Stacking Audit**: If a component uses absolute/fixed positioning or `createPortal`, you MUST check the `z-index` of its parent containers.
- **Overflow Check**: Verify that `overflow: hidden` on parent containers is not clipping child elements (especially Modals and Dropdowns).
- **Transformation Warning**: Never place fixed-position elements inside a container with `transform`, `filter`, or `perspective` as this creates a new stacking context that breaks `z-index`.

## 3. Brand & Status Consistency
- **Color Validation**:
  - **Buzzing (Gold)**: `#fbbf24` (Amber-400).
  - **Packed (Pink)**: `#ec4899` (Pink-500).
  - **Mellow (Slate)**: `#64748b` (Slate-500).
- **Legibility**: Text on branded backgrounds must maintain a contrast ratio of at least 4.5:1. Use white text for Pink/Gold backgrounds.

## 4. The "Drunk Thumb" Reliability
- **Touch Targets**: All interactive elements (Buttons, Tab Bars, List Items) must be at least 44x44px.
- **Padding Sanity**: Ensure interactive areas have enough "Breathing Room" to prevent accidental clicks on adjacent items.
- **Truncation Policy**: Venue names and event titles should wrap rather than truncate wherever possible to ensure the "Nightlife OS" remains readable on small devices.
