# Bead: Integration Test Infrastructure (B015)

> "The Safety Net"

## Status
- [x] **Complete**
- [x] **Closed** (2026-01-27)

## Context & Philosophy
Unit tests with mocks (`jest.mock`) have "lied" to us. They pass even when the backend API is broken or permissions are missing. To adhere to our "Operational Realism" principle, we must verify code against the *actual* cloud resources.

**Strategic Pivot:**
We are explicitly choosing NOT to refactor the existing unit tests (`venueService.test.ts`) to avoid regression in pure logic testing. Instead, we are building a parallel **Integration Suite** (`venueService.integration.test.ts`) that is dedicated to "Connectivity & Schema Verification".

## Objective
Create a test suite that fails if the backend database schema drifts or if security rules prevent access.

## Specification
- **Test Target:** `server/src/__tests__/venueService.integration.test.ts`.
- **Configuration:** 
    - Must load `.env.staging` to target `ama-ecosystem-dev-9ceda`.
    - Must use Google Application Default Credentials (ADC) or a Service Account Key.
- **Scope:**
    - `fetchVenues()`: Returns > 0 items.
    - Data Shape: Verifies critical fields (`id`, `name`, `status`) exist.
- **Constraints:**
    - **Performance Budget:** Test Suite must complete in < 10s (excluding cold boot). If it's slow, devs won't run it.

## Implementation Tasks
- [ ] **Setup Jest Configuration**
    - [ ] Support loading `.env` files in Jest.
    - [ ] Configure strict timeouts (Cloud calls take time).
- [ ] **Create Integration Test File**
    - [ ] Test 1: Authenticate with Firebase Admin.
    - [ ] Test 2: Fetch Venues (Live).
    - [ ] Test 3: Validate Venue Schema (zod parse).

## Dependencies
- B014 (Dev Stabilization): We need a working backend before we can test it.
