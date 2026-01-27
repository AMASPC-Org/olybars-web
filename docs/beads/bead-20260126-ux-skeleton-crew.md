# Bead: UX - The Skeleton Crew (Loading States)

**ID:** `bead-20260126-ux-skeleton-crew`
**Status:** Approved for Execution
**Type:** React / UI
**Priority:** Medium

---

## 1. Objective
Replace "Spinners" with "Shimmering Skeletons" to improve perceived performance.

## 2. Background
*   **Rule**: If you know the *shape* of the data coming in, draw the shape.
*   **Anti-Pattern**: A single spinner in the middle of a white page.

## 3. Implementation Plan

### 3.1 The `<Skeleton />` Primitive
*   [ ] **Create Component**: `src/components/ui/Skeleton.tsx`.
*   [ ] **Props**:
    *   `className`: For width/height overrides.
    *   `variant`: `'rect' | 'circle' | 'text'`.
*   [ ] **Styles**:
    *   `bg-white/5` (Base color).
    *   `animate-pulse` (Native Tailwind pulse is good enough, no need for complex shimmer gradients unless needed).
    *   `rounded-md` (rect) vs `rounded-full` (circle).

### 3.2 Integration Points
*   [ ] **Venue List**:
    *   Create `VenueCardSkeleton` (Composition of Rect + Text lines).
    *   Show 3x items while `useVenues` is loading.
*   [ ] **Profile**:
    *   `UserAvatarSkeleton` (Circle).
    *   `PointsSkeleton` (Small Rect).
*   [ ] **Artie Chat**:
    *   `TypingIndicator` (3 bouncing dots) instead of Skeleton (Chats are dynamic height).

## 4. Considerations
*   **CLS (Layout Shift)**: The Skeleton logic must be strict about height. If a card is 200px, the skeleton must be 200px.
