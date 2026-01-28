# Bead: Dev Environment Stabilization (B014)

> "The Foundation"

## Status
- [x] **Complete**
- [x] **Closed** (2026-01-27)

## Context & Philosophy
The Development environment is the bedrock of our engineering velocity. Currently, it suffers from "drift" where local mocks (`initialData: []`) hide real production issues. This bead enforces a "Production Parity" mandate: `npm run dev` must act exactly like `prod` but pointing to a safe sandbox database. 

**Why this matters:** 
We cannot reliably build complex features (like the Scraper or Bouncer logic) if we don't trust our local data layer. This bead eliminates the "it works on my machine" class of bugs forever.

## Objective
Achieve 100% reliable rendering of Live Dev Data in the local environment and the deployed Dev URL.

## Specification
- **Data Layer:** 
    - `useQuery` must NOT use `initialData: []` as this swallows fetch errors. It must be `undefined` to force a hard fetch.
    - `venueService` must log exact API REQUEST/RESPONSE pairs to the console for easy debugging.
- **Environment:**
    - `.env.development` must set `VITE_USE_EMULATORS=false` (or we explicitly toggle it).
    - IAM permissions for the Cloud Run service account must allow `datastore.user`.

## Implementation Tasks
- [ ] **Fix Frontend Data Fetching**
    - [ ] Update `App.tsx`: Change `initialData` return to `undefined`.
    - [ ] Verify `venueService.ts`: Ensure `console.log` traces are present.
- [ ] **Verify Cloud Run Access**
    - [ ] Confirm IAM Roles: `datastore.user`, `firebase.admin`.
    - [ ] Deploy `olybars-backend` using `npm run build -- --mode staging` (Critical: ensures `VITE_USE_EMULATORS=false`).
- [ ] **Visual Verification**
    - [ ] Run `visual-verification.ts`.
    - [ ] Confirm venue cards render (count > 0).

## Dependencies
- None. This is the root dependency for all future work.
