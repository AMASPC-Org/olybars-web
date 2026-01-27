# Bead: UX - Typography Tuning (Hierarchy & Rhythm)

**ID:** `bead-20260126-ux-typography`
**Status:** Approved for Execution
**Type:** Design / CSS
**Priority:** Medium

---

## 1. Objective
Establish a clear visual hierarchy. Stop screaming at the user with `font-black`.

## 2. Background
*   **Current State**: Everything is `font-black uppercase`. It's "Gymcore".
*   **Target State**: "Nightlife OS". Elegant, legible, actionable.
    *   **Headlines**: `font-black` (Oswald).
    *   **Body**: `font-normal` (Roboto Condensed).
    *   **UI/Labels**: `font-bold` (Roboto Condensed) + `uppercase` + `tracking-widest`.

## 3. Implementation Plan

### 3.1 The Weight Audit (Global Search/Replace)
*   [ ] **Sidebar/Navigation**:
    *   Downgrade items from `font-black` to `font-bold` (700).
    *   *Result*: Menu items become "options", not "declarations".
*   [ ] **Card Metadata**:
    *   Address/Time info -> `font-medium` (500) + Mixed Case.
    *   *Rule*: Only the Venue Name is Uppercase Black.

### 3.2 Letter Spacing (Tracking)
*   [ ] **Refine Classes**:
    *   If `uppercase`: MUST be `tracking-widest` (0.1em).
    *   If `font-black` (>24px): MUST be `tracking-tighter` (-0.025em).

### 3.3 Text Colors (Contrast Hierarchy)
*   [ ] **Standardize Colors**:
    *   `text-white`: Primary Content (Headlines, Values).
    *   `text-slate-400`: Secondary (Metadata, Descriptions).
    *   `text-slate-600`: Tertiary (Dividers, empty states).

## 4. Considerations
*   **Legibility**: "Roboto Condensed" is narrow. At small sizes (<14px), it needs extra tracking or weight to be readable. Avoid `font-light` completely.
