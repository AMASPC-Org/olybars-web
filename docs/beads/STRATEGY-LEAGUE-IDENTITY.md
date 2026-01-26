# Strategy: League Identity Migration (The "Citizenship Card" Architecture)

> [!IMPORTANT]
> **Metaphor**: The `UserContext` is the user's "Citizenship Card" (or Passport). 
> Instead of `App.tsx` handing the user their ID card every time they walk into a room (Prop Drilling), the user holds their own ID card (`UserContext`) and shows it whenever asked (`useUser()`).

## 1. The Problem: "The Holographic Ghost"
Currently, our Identity Logic suffers from **"The Holographic Ghost"** effect: two versions of the user exist simultaneously.
1.  **The Root State** in `App.tsx` (The "Real" User).
2.  **The Prop State** passed down 4 levels deep (The "Hologram").

**Current Issues:**
*   **Split Brain**: `App.tsx` handles `auth` changes, but children read stale props.
*   **Prop Drilling Hell**: `AppShell` -> `Sidebar` -> `UserMenu` just to show a name.
*   **Fragile Hydration**: Logic for "Guest" vs "User" is duplicated in `localStorage` reads across components.
*   **Syntax Complexity**: `App.tsx` is 1550+ lines long because it's doing `UserContext`'s job.

## 2. The Solution: "Single Source of Truth"

We will move ALL Identity Logic into `UserContext`. `App.tsx` becomes a dumb container that just renders routes.

### Core Components

1.  **`UserContext.tsx` (The Vault)**
    *   **Responsibility**: Holds `userProfile`, `isAuthenticated`, `isLoading`, and `authToken`.
    *   **Logic**: Handles Firebase `onAuthStateChanged`, LocalStorage hydration, and Session Purging.
    *   **Status**: [CREATED]

2.  **`useUser()` Hook (The Accessor)**
    *   **Responsibility**: Allows any component to instantly check "Who am I?".
    *   **Safety**: Throws error if used outside Provider.
    *   **Status**: [CREATED]

3.  **`AppShell` & Children (The Consumers)**
    *   **Responsibility**: Render UI based on context, not props.
    *   **Refactor**: Remove `userProfile` props from `AppShell`, `Sidebar`, `BouncerGate`, etc.

## 3. Implementation Beads (Granular Plan)

We will execute this migration in 4 distinct "Beads" (Work Units).

---

### Bead A: THE FOUNDATION (UserContext Setup)
**Goal**: Create the Context and Hook to serve as the new bedrock.
*   **Status**: [COMPLETE]
*   **Tasks**:
    *   [x] Create `UserContext.tsx` with hydration logic.
    *   [x] Export `useUser` hook.
    *   [x] Wrap `App` in `<UserProvider>`.

### Bead B: THE TRANSPLANT (App.tsx Cleanout)
**Goal**: The Big delete. Remove the legacy "Brain" from `App.tsx` and connect it to Context.
*   **Rationale**: We must verify the "Engine" (Context) works in the root component *before* we unplug the "Dashboard" (AppShell).
*   **Tasks**:
    *   **[ ] Swap the Engine**
        *   In `App.tsx`, replace `const [userProfile, setUserProfile] = useState(...)` with `const { userProfile, setUserProfile, isLoading } = useUser()`.
    *   **[ ] Prune Legacy Code**
        *   DELETE `onAuthStateChanged` effect (Lines ~88-140 in original).
        *   DELETE `localStorage` hydration effects (Lines ~750-760).
        *   DELETE `handleLogout` manual logic (Use `logout()` from context).
    *   **[ ] Resolve Loading State**
        *   Ensure `if (isLoading) return <LoadingScreen />` uses the Context's loading state.

### Bead C: THE BYPASS (AppShell Refactor)
**Goal**: Stop the "prop bleed" at the main layout level.
*   **Rationale**: Now that `App.tsx` is powered by Context, we can safely disconnect the props chain without "Split Brain" issues.
*   **Tasks**:
    *   **[ ] Refactor `AppShell.tsx`**
        *   Remove `userProfile` from props interface.
        *   Inject `const { userProfile } = useUser()` inside the component.
    *   **[ ] Refactor `Sidebar.tsx`**
        *   Remove `userProfile` from props.
        *   Consume `useUser()` directly.


### Bead D: THE SATELLITE UPLINKS (Child Components)
**Goal**: Connect isolated components to the new network.
*   **Rationale**: `ClockInModal` and `BouncerGate` are currently checking props. They need to check the Context.
*   **Tasks**:
    *   **[ ] Refactor `BouncerGate.tsx`**
        *   Remove `userProfile` prop.
        *   Use `useUser()` to check `isAuthenticated` and `userProfile.role`.
    *   **[ ] Refactor `ClockInModal.tsx`**
        *   Remove `userProfile` prop.
        *   Use `useUser()` for ID and Name checks.

### Bead E: THE INTEGRITY CHECK (Verification)
**Goal**: Prove the new system works and "The Ghost" is gone.
*   **Tasks**:
    *   [ ] **Login Cycle**: Login -> Reload Page -> Verify still logged in (Hydration).
    *   [ ] **Logout Cycle**: Logout -> Verify "Nuclear Purge" (Guest state).
    *   [ ] **Prop Audit**: Search codebase for `<AppShell userProfile={...}` (Should be 0 results).

## 4. "Future Self" Notes

*   **Risk**: `App.tsx` has *other* state like `userPoints` and `clockInHistory`.
    *   *Decision*: Leave those for now. We are **ONLY** migrating Identity (`userProfile`). Do not try to move Points logic yet, or you will destabilize the bead.
*   **Risk**: `BouncerService` might need `userProfile`.
    *   *Mitigation*: Pass `userProfile` from `App.tsx` *into* `useBouncer` hooks if needed, OR refactor `useBouncer` to consume `UserContext` directly (Preferred).
