# Bead: SEC-03 - Backend Zero-Trust Enforcement

> **Status**: OPEN
> **Agent**: Antigravity
> **Priority**: Critical (P0)
> **Type**: Backend / Security
> **Dependencies**: SEC-01
> **Estimated Effort**: Medium

## Context
Backend functions (`artieChat`, `schmidtChat`) must strictly enforce the Persona Manifest. We cannot trust the frontend.

## Reasoning & Justification
- **Zero-Trust**: Validate `user.role` from the decoded token against `persona_manifest.ts`.
- **Tool Blindness**: Security isn't just 403s. It's also ensuring `artieChat` simply *does not have access* to sensitive tools (like `updateVenue`) in its Genkit configuration.

## Goals
1.  **Sync Manifest**: Copy `src/config/persona_manifest.ts` to `functions/src/config/`.
2.  **Cloud Guard**: Update `schmidtChat` to enforce `user.role === OWNER`.
3.  **Tool Segregation**: Ensure `artieChat` Genkit flow has *zero* Owner tools registered.

## Implementation Details

### 1. Manifest Sync
- Create `scripts/sync-manifest.ts` or simply copy the file during this bead execution.
- Ensure `functions/src/index.ts` imports from *its local copy*.

### 2. `schmidtChat` Hardening
- **Logic**:
    - Decode Token.
    - Check `user.role`.
    - If `role !== 'owner'`, throw `HttpsError('permission-denied')`.

### 3. `artieChat` Segregation
- Audit `functions/src/flows/artieChat.ts`.
- Verify the `tools: []` array contains ONLY `BASE_ARTIE` allowed tools.
- Explicitly remove any "catch-all" or "admin" tools if present.

## Acceptance Criteria
- [ ] `curl POST /schmidtChat` (Guest Token) -> 403.
- [ ] `curl POST /artieChat` (Guest Token, "Update Menu") -> Artie refuses (Logic/Tool missing), not 500 error.
- [ ] `functions/src/config/persona_manifest.ts` matches Master.
