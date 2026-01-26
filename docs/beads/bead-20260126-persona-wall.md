# Bead: Persona Wall Enforcement

**ID:** `bead-20260126-persona-wall`
**Status:** Done (Agent Z9X1)
**Type:** Component/Security
**Priority:** High
**Owner:** Z9X1

---

## 1. Context & Problem Statement

OlyBars serves two distinct personas with fundamentally different goals and data access needs:

*   **Guest (The "Vibe" User)**: Guided by **Artie** (The Mystic Local). Needs "Vibe Checks", "Events", "Points". **MUST NOT** see margin data, operational alerts, or "Schmidt" coaching.
*   **Owner (The "Ops" User)**: Guided by **Schmidt** (The Ops Coach). Needs "Vibe decay rates", "Staff clock-ins", "Competitor analysis".

**Current Leakage**:
1.  `useSchmidtOps` hook is often initialized globally, potentially running permission checks on guests.
2.  UI components sometimes hardcode "Artie" where "Schmidt" should speak (or vice versa).
3.  No centralized "Voice Switcher" based on the active route.

## 2. Objectives

1.  **Strict Hook Gating**: Refactor `useSchmidtOps` to throw/return null immediately if `userProfile.role === 'guest'`, preventing unnecessary compute and potential leaks.
2.  **Route-Based Personality Switching**: Implement a `PersonaProvider` that listens to `useLocation`:
    *   `/owner/*`, `/manage/*` $\rightarrow$ activates **Schmidt**.
    *   `/venues/*`, `/map`, `/` $\rightarrow$ activates **Artie**.
3.  **Data Security Guardrail**: Ensure `venuePermissions` and `ownerData` are stripped from the `userProfile` object when sending to a client identified as "Guest" (Backend verification).

## 3. Execution Plan

### 3.1 Architecture: The `PersonaProvider`
- [x] Create `src/contexts/PersonaContext.tsx`.
    -   State: `activePersona: 'artie' | 'schmidt'`.
    -   Logic: Effect hook on `location.pathname` to switch automatically.
    -   Export: `usePersona()` hook providing the current avatar, color theme (Artie=Purple/Gold, Schmidt=Blue/Grey), and voice.

### 3.2 Security: Hook Hygiene
- [x] Refactor `src/hooks/useSchmidtOps.ts`:
    -   Add `if (!isOwner(user)) return null;` at the top.
    -   Ensure it does not subscribe to Firestore listeners for guest users.

### 3.3 UI: The Bifurcated Chat
- [x] Refactor `AppShell.tsx` to render the correct "Guide" button (Artie Face vs Schmidt Face) based on `usePersona()`.
- [x] Ensure `GlobalChat` (if strictly for owners) is hidden from guests.

### 3.4 Verification (The Ryan Rule)
- [x] Test the **Super Admin** view (`ryan@amaspc.com`). Ensure they can manually toggle the persona for support/debugging purposes (e.g., "View as Guest").

## 4. Dependencies
- `App.tsx` (for Context Provider wrapping)
- `useSchmidtOps.ts`
- `AppShell.tsx`

## 5. Definition of Done
- Guest users browsing `/map` NEVER trigger a "Schmidt" log or hook.
- Owners on `/owner` see Schmidt by default.
- No "Coach" UI elements visible to Guests.
