# Bead: SEC-01 - Persona Manifest & Boundary Tests

> **Status**: OPEN
> **Agent**: Antigravity
> **Priority**: Critical (P0)
> **Type**: Architecture / Security
> **Dependencies**: None
> **Estimated Effort**: Small

## Context
The project suffers from "Persona Blending," where the Artie (Guest) and Schmidt (Owner) personas are not strictly separated in code. This leads to security risks (guests accessing owner functions) and architectural confusion.

## Reasoning & Justification
- **Declarative Lockdown**: To prevent the agent from "hallucinating" permissions, we must provide a hard-coded "Source of Truth" (`persona_manifest.ts`).
- **Loop Architecture**: Tests must come *before* the fix. The `persona_boundary.test.ts` suite will serve as the "lock."
- **Shared Code Strategy**: Since `functions/` and `src/` are isolated, we declare `src/config/persona_manifest.ts` as the **MASTER**. We will verify synchronization via tests rather than complex monorepo tooling.

## Goals
1.  **System of Truth**: Create `src/config/persona_manifest.ts`.
2.  **The Lock**: Create `tests/persona_boundary.test.ts`.
3.  **Baseline Failure**: Run the tests to confirm the current "leaky" state.

## Implementation Details

### 1. The Manifest (`src/config/persona_manifest.ts`)
- **Structure**:
  ```typescript
  export const PERMISSIONS = {
    BASE_ARTIE: ['chat', 'search', 'clock_in', 'vibe_check'],
    EXTENDED_SCHMIDT: ['venue_ops', 'marketing', 'analytics'] // Superset is implied by logic, or we can spread ...BASE_ARTIE here
  } as const;
  ```
- **Constraint**: Dependency-free. Pure TypeScript.

### 2. The Verification Suite (`tests/persona_boundary.test.ts`)
- **Type**: Integration Test (Node.js script).
- **Target**: Local Emulator (`localhost:5001`).
- **Logic**:
    - **Sync Check**: Verify `functions/src/config/persona_manifest.ts` (if we copy it) matches Master.
    - **Access Check**: Iterate `EXTENDED_SCHMIDT` capabilities.
    - **Action**: Authenticate as **GUEST** (Artie) and attempt execution.
    - **Expectation**: HTTP 403 Forbidden.

## Acceptance Criteria
- [ ] `src/config/persona_manifest.ts` exists.
- [ ] `tests/persona_boundary.test.ts` exists.
- [ ] Test fails (`Exit Code 1`) if Artie can access Schmidt functions.
