# Bead: Session Purge Protocol

**ID:** `bead-20260126-session-purge`
**Status:** Claimed (Agent Z9X1)
**Type:** Security/State-Management
**Priority:** Medium
**Owner:** Z9X1

---

## 1. Context & Problem Statement

When a user logs out or a session expires, client-side state often lingers.
*   **Risk**: A bar owner (Schmidt persona) logs out on a shared device. A guest (Artie persona) logs in. The "Schmidt" context (e.g., `draftData`, `opsState`) might persist in LocalStorage or React State, leaking sensitive operational fragments or confusing the new user.
*   **Goal**: Ensure a "Scorched Earth" policy upon logout or persona switch.

## 2. Objectives

1.  **State Sanitation**: Create a `SessionPurgeService` utility that:
    *   **Nuclear Purge (Logout)**: Clears all `oly_*` sesssion keys (`oly_profile`, `oly_points`, `auth_token`) but **Preserves** Quality of Life keys (`olybars_view_mode`, `oly_age_gate`).
    *   **Context Reset**: Resets `queryClient` cache (TanStack Query) to remove cached API responses.
    *   **Memory Flush**: Forces a hard redirect to `/` to clear React memory state.
2.  **Trigger Integration**: Connect this service to the `SignOut` action in `userService.ts` or `AppShell.tsx`.
3.  **Persona Transition**: Ensure switching from Owner -> Guest triggers a "Soft Purge" (keeping some cached data like venues, but dumping admin data).

## 3. Execution Plan

### 3.1 The Purge Service
- [ ] Create `src/services/SessionPurgeService.ts`.
    -   `PRESERVED_KEYS`: `['olybars_view_mode', 'oly_age_gate', 'oly_terms']`.
    -   `purgeSession(mode: 'nuclear' | 'switch')`:
        -   If `nuclear`: Loops through `localStorage`, removes everything NOT in PRESERVED_KEYS. Calls `queryClient.clear()`.
        -   If `switch`: Calls `queryClient.removeQueries({ queryKey: ['owner'] })`.

### 3.2 Integration
- [ ] Update `AppShell.tsx` `onLogout` to call `SessionPurgeService.purgeSession('nuclear')`.
- [ ] Update `routes.ts` or `PersonaContext` handles to call `purgeSession('switch')` when moving from Owner -> Guest routes.

### 3.3 Verification
- [ ] Manual Test: Login as Owner -> Logout -> LocalStorage check -> Login as Guest -> Verify no leakage.

## 4. Dependencies
- `queryClient` (for cache clearing).
- `localStorage` util.

## 5. Definition of Done
- Logout keeps "Dark Mode" (if exists) or "View Mode" preference, but destroys all User Data.
- No `schmidt` artifacts survive a transition to `artie`.
