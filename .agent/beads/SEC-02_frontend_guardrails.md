# Bead: SEC-02 - Frontend Guardrails (User Identity)

> **Status**: OPEN
> **Agent**: Antigravity
> **Priority**: Critical (P0)
> **Type**: Frontend / State
> **Dependencies**: SEC-01
> **Estimated Effort**: Medium

## Context
Currently, the frontend relies on `useSchmidtOps.ts` to manage its own authentication state. We need a central `usePersona` hook and visual guardrails.

## Reasoning & Justification
- **Single Source of Truth**: `usePersona.ts` centralizes "Role Check" + "Venue Permission Check".
- **UX Stability**: We must handle `auth.loading` states to prevent "Flash of Access Denied" where a valid owner is briefly shown the Guest view while Firebase initializes.

## Goals
1.  **Identity Hook**: Implement `usePersona.ts`.
2.  **Visual Gate**: Create `PersonaGuard.tsx`.
3.  **Refactor**: Cleanup `useSchmidtOps.ts`.

## Implementation Details

### 1. `usePersona.ts`
- **Return Signature**:
  ```typescript
  {
     persona: 'GUEST' | 'OWNER';
     isLoading: boolean;
     canAccess: (viz: string) => boolean;
  }
  ```
- **Logic**: If `auth.loading`, return `isLoading: true`. Do not calculate persona yet.

### 2. `PersonaGuard.tsx`
- **Props**: `{ requiredCapability: string, fallback?: ReactNode }`.
- **Logic**:
  - If `isLoading`: Render `<Spinner />`.
  - If `!canAccess(req)`: Render `<Redirect to="/" />` or `fallback`.
  - Else: Render `children`.

### 3. Cleanup
- Remove ad-hoc auth checks from `useSchmidtOps.ts`.
- Ensure `OwnerDashboardScreen` is wrapped in `<PersonaGuard requiredCapability="venue_ops" />`.

## Acceptance Criteria
- [ ] Guest User visiting `/dashboard` is redirected.
- [ ] No "Flash of Access Denied" for Owners on refresh.
- [ ] `useSchmidtOps` is purely functional (no auth side-effects).
