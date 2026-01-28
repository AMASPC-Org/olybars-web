# Bead: ARCH-02 - Core Architecture & State Migration

> **Status**: OPEN
> **Priority**: Critical (P0)
> **Dependencies**: None

## Goals
1.  **Layout Stability**: Move `Suspense` inside `AppShell` so the UI shell persists during navigation.
2.  **State Centralization**: Move UI state (Modals, Chrome) to `LayoutContext` and Data logic to `DiscoveryContext`.
3.  **Performance**: Decouple `VenuesScreen` from heavy logic.
4.  **Compliance**: Ensure `GatekeeperModal` protects private venues.

## Implementation Details (The "Future Self" Guide)

### 1. `src/contexts/LayoutContext.tsx`
*   **Purpose**: The "Brain" of the UI Shell.
*   **State**: `activeModal` (Enum), `viewMode` (Persisted), `isChromeVisible` (Boolean).
*   **Exports**: `useLayout()` hook, `openModal(type, data)`.

### 2. `src/features/venues/contexts/DiscoveryContext.tsx`
*   **Target State**: Must hold/process the **Data**.
*   **Action**: Accept `venues` as a prop. Move the 450-line filtering logic here. Expose `processedVenues`.

### 3. `src/components/layout/AppShell.tsx`
*   **Action**: Remove ALL 17 props.
*   **New Dependencies**: `useDiscovery()` (for BuzzClock), `useLayout()` (for Modals), `useGamification()`.
*   **Structure**: Wrap `<Outlet />` in `Suspense`. Add `GlobalModals` component.

### 4. `src/features/venues/screens/VenueProfileScreen.tsx`
*   **Action**: Add `<GatekeeperModal />` driven by `activeModal` state.

## Task Graph & Dependencies

- [ ] **Step 1: Layout Core**
    - [ ] Create `LayoutContext.tsx` with Modal State Machine.
    - [ ] Wrap `App.tsx` (inner) or `AppShell` in `LayoutProvider`.
- [ ] **Step 2: Data Layer Lift**
    - [ ] Update `DiscoveryContext` to accept `venues` prop.
    - [ ] **Extract** the giant filtering `useMemo` from `VenuesScreen.tsx` -> `DiscoveryContext.tsx`.
    - [ ] Verify `VenuesScreen` still works by consuming `useDiscovery().processedVenues`.
- [ ] **Step 3: Shell Surgery**
    - [ ] Remove `Suspense` from `App.tsx`.
    - [ ] Add `Suspense` to `AppShell.tsx` (wrapping Outlet).
    - [ ] Strip props from `AppShell`.
    - [ ] Wire up `BuzzClock` to use `useDiscovery()`.
    - [ ] Wire up Header buttons to use `useLayout().openModal()`.
- [ ] **Step 4: Modal Migration**
    - [ ] Move Modals from `App.tsx` to `AppShell` (or a `GlobalModals` component).
    - [ ] Ensure `GatekeeperModal` works in `VenueProfileScreen`.

## Acceptance Criteria
1.  **Navigation**: Clicking a venue DOES NOT flash the white screen.
2.  **Modals**: ClockIn, Login, and VibeCheck modals open correctly from the Shell.
3.  **Code Quality**: `AppShell` has 0 props. `VenuesScreen` is < 300 lines.
