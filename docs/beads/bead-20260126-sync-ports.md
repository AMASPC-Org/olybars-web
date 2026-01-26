# Bead: Environment Unification (Architecture)
> **Context:** Fixing "Sync & Deploy" death loop. Phase 2: Ports.
> **Goal:** Make Localhost (Port 3001) aligned with Cloud (Port 5001) structure.

## Status: Closed
<!-- Completed 2026-01-26: Implemented VITE_UPSTREAM and VITE_AUTH_EMULATOR_URL -->

## Tasks
- [x] **Vite Config Hardening** <!-- id: 1 -->
    - Update `vite.config.ts` to implement `VITE_UPSTREAM`.
    - Default to `3001` (Fast Mode) if undefined.
    - Warn if upstream is unreachable.
- [x] **Frontend Abstraction** <!-- id: 2 -->
    - Remove `http://localhost:9099` from `src/lib/firebase.ts`.
    - Use `import.meta.env.VITE_AUTH_DOMAIN` (Corrected to `VITE_AUTH_EMULATOR_URL` in implementation).
