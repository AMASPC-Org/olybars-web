# Strategy: Bouncer Logic Migration (The "Velvet Rope" Architecture)

> [!IMPORTANT]
> **Metaphor**: The "Bouncer" is the single source of truth for *Access* and *Action Eligibility*. 
> Just as a real bouncer checks ID, cover charge, and capacity at the door, our `BouncerService` determines who can do what, where, and when.

## 1. The Problem: "Sidewalk Logic"
Currently, our "gatekeeping" logic is scattered across various UI components (`ClockInModal`, `App.tsx`, `SmartOwnerRoute`). This is "Sidewalk Logic"—decisions are made out on the street (UI layer) rather than at a secure checkpoint.

**Current Issues:**
*   **Redundant Geofencing**: `ClockInModal` calculates distance manually. `VibeCheckModal` likely does it again.
*   **Inconsistent Cooldowns**: Timer logic is buried in `useEffect`s inside components.
*   **Fragile Permissions**: Admin overrides ("Ryan Rule") are hardcoded in `App.tsx` hydration rather than a central auth policy.
*   **Hardcoded Points**: Point values (`+10`, `+50`) are scattered in UI code, making global balancing (e.g., "Double Points Night") impossible.
*   **Zombie State**: Guests can sometimes see UI for features they can't actually use until a backend 403 fails.

## 2. The Solution: "The Velvet Rope" (Centralized Architecture)

We will introduce a unified **Bouncer Layer** that sits between the User Profile and the Feature Logic.

### Core Components

1.  **`BouncerService.ts` (The Brain)**
    *   **Pure TypeScript Service** (No React).
    *   **Responsibility**: Stateless validation & *Point Estimation*.
    *   **Methods**:
        *   `validateAction(context: BouncerContext): ValidationResult`
        *   `estimatePoints(actionString, venueStatus?): number`
        *   `checkDistance(userLoc, venueLoc): boolean`
    *   **Rich Return Types**:
        ```typescript
        type ValidationResult = 
          | { status: 'ALLOWED' }
          | { status: 'LOCKED_DISTANCE', distance: number, threshold: number }
          | { status: 'LOCKED_COOLDOWN', remainingMs: number }
          | { status: 'SHADOW_MODE', reason: 'GUEST_WALL' } // The "Honest Gate"
        ```

2.  **`useBouncer.ts` (The Eyes & Hands)**
    *   **React Hook**.
    *   **Responsibility**: Binds `BouncerService` to React State (`useGeolocation`, `usePersona`).
    *   **Exports**:
        *   `canClockIn`: ValidationResult
        *   `canVibeCheck`: ValidationResult
        *   `admissionStatus`: `'VIP' | 'MEMBER' | 'GUEST' | 'BANNED'`
    *   **"Ryan Rule"**: Automatically injects `isAdmin` context into the Service calls.

3.  **`Gatekeeper` Components (The Muscle)**
    *   `<BouncerGate type="owner" venueId="...">`
    *   `<BouncerGate type="age_21+">`
    *   Replaces inline checks in `App.tsx` and specific Modals.

## 3. Implementation Beads (Granular Plan)

We will execute this migration in 4 distinct "Beads" (Work Units).

---

### Bead A: THE BOUNCER PROTOCOL (Core Service)
**Goal**: Extract the math, rules, and *Points Logic* into a pure service.

*   **[ ] Scaffold `src/services/BouncerService.ts`**
    *   Migrate `calculateDistance` logic.
    *   Migrate `PULSE_CONFIG` constants (Geofence radius).
    *   Migrate Cooldown calculations (Time math).
*   **[ ] Centralize Point Math**
    *   Move `GAMIFICATION_CONFIG` lookups into `BouncerService.estimatePoints()`.
    *   This allows dynamic modifiers (e.g., "Pioneer Curve") to live in one place.
*   **[ ] Define Rich Validation Types**
    *   Implement the `ValidationResult` union type (Allowed, Locked, Shadow, etc.).
*   **[ ] Test Coverage**
    *   Unit test distance checks, cooldowns, and Admin Bypass logic.

### Bead B: THE VELVET ROPE (Reactive Hook)
**Goal**: Create the reactive layer that connects the Bouncer to the live app.

*   **[ ] Create `src/hooks/useBouncer.ts`**
    *   Consume `useGeolocation` and `usePersona`.
    *   Expose `validate(action, venue)` methods.
    *   Handle "Shadow Mode" logic (Guest gets a 'Soft Yes' to encourage sign-up).
*   **[ ] Integrate "Ryan Rule"**
    *   Ensure Super Admin bypasses **ALL** checks (Geofence, Cooldowns) via the Bouncer context.

### Bead C: GATE MIGRATION (Consumer Refactor)
**Goal**: Rip out the "Sidewalk Logic" from Modals and replace with the Bouncer.

*   **[ ] Refactor `ClockInModal.tsx`**
    *   Remove `calculateDistance` and `GAMIFICATION_CONFIG` imports.
    *   Use `bouncer.validateClockIn(venue)` to drive the UI state (Locked/Allowed).
    *   Use `bouncer.estimatePoints('clockin')` for the UI feedback text.
*   **[ ] Refactor `VibeCheckModal.tsx`**
    *   Standardize cooldown checks using `bouncer.getCooldownSatus()`.

### Bead D: THE VIP LIST (Admin Security)
**Goal**: Secure the high-value routes (Owner Dashboard).

*   **[ ] Refactor `SmartOwnerRoute` (in App.tsx)**
    *   Move the complex `isAuthorized` logic into `BouncerService.validateOwnerAccess()`.
    *   Replace redirect logic with a standard `<BouncerGate>` wrapper.
*   **[ ] Secure Owner Portal**
    *   Ensure deep links to `/owner/:id` are validated against the Bouncer.

## 4. Operational Considerations

*   **Offline Mode**: The Bouncer service is pure TS/Logic, so it works perfectly offline.
*   **GPS Drift**: Maintain the current "Shadow Success" pattern for Guests.
*   **Points Integrity**: By centralizing point math, we prevent UI/Backend mismatches.
