# Bead: UX/Architecture Polish (B016)

> "The Stripe Standard"

## Status
- [/] **In Progress**

## Context & Philosophy
Functionality without finish is debt. A "working" app that jumps around while loading or feels unresponsive erodes user trust instantly. This bead represents a shift from "Engineering Core" to "Product Excellence." We are adopting a mindset where *layout stability* and *interaction feedback* are functional requirements, not "nice to haves."

**Key Principles:**
1.  **Skeleton Screens > Spinners:** Never show a blank screen. Show the structure of what's coming.
2.  **Stable Layouts:** Images must reserve space before they load (`aspect-ratio`).
3.  **Tactile Feedback:** Every tap acknowledges the user (`active:scale`).

## Objective
Refine `VenuesScreen` and global navigation to feel native, instant, and premium.

## Specification
- **Skeleton Loading:** Create `<VenueCardSkeleton>` that mirrors the exact DOM structure of the card (image height, text blobs).
- **Empty States:** "Zero Data" is a UI state. It needs illustration and action (CTA), not just text.
- **Micro-Interactions & Optimism:**
    -   **Optimistic UI:** "Vibe Check" button must toggle *instantly* (local state) while the network request flies. Revert on error.
    -   Cards: `transform: scale(0.98)` on press.
    -   Icons: Subtle color shifts and movements on hover.
- **States:**
    -   **Premium Empty State:** Illustration + CTA for "No Results".
    -   **Discrete Error State:** "You're Offline" banner vs "Server Error". Don't confuse the user.
- **Performance:** `backdrop-filter` must use browser-safe implementation.

## Implementation Tasks
- [ ] **Component: VenueCardSkeleton**
    - [ ] Build component using `animate-pulse` and `bg-slate-800`.
    - [ ] Integrate into `VenuesScreen.tsx` (replace `isLoading` check).
- [ ] **Component: PremiumEmptyState**
    - [ ] Design SVG/Icon illustration (e.g., Ghost/Neon Sign off).
    - [ ] Add "Explore Map" or "Clear Filters" CTA.
- [ ] **Interaction Polish (The "Stripe" Feel)**
    - [ ] **Optimistic Vibe Check:** Implement specific React Query `onMutate` logic.
    - [ ] Add Tailwind utility classes for touch feedback.
    - [ ] Enforce Aspect Ratio on Venue Gallery images.

## Dependencies
- B014 (Data needs to load before we can polish how it loads).
