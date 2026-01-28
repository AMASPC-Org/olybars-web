# Bead: E2E Verification Flight (B017)

> "The Green Light"

## Status
- [ ] **Pending**

## Context & Philosophy
Manual verification is slow, error-prone, and boring. "Visual Verification" scripts are good, but they are passive. They look at the screen but don't *touch* it. This bead elevates our assurance level by scripting an active User Journey: A robot user that wakes up, logs in, goes to a bar, orders a vibe check, and goes home.

**The "Canary" Principle:**
This E2E script serves as our canary in the coal mine. A single failure here stops deployment.

## Objective
Automate the core "Guest User Journey" against the Live Dev environment.

## Specification
- **Tooling:** Playwright (already installed).
- **Environment:** Live Dev URL (`https://ama-ecosystem-dev-9ceda.web.app/`).
- **User:** Guest User (Anonymous Auth) to start, potentially upgrading to Authenticated if feasible.
- **Flow:**
    1.  Land on Home Page (Bypass Age Gate).
    2.  Wait for Venues to Hydrate (Skeleton -> Content).
    3.  Click first "Open" Venue.
    4.  Verify Navigation to Venue Detail.
    5.  Check for "Vibe Check" button visibility.
- **Robustness:**
    - Use data-testid attributes where possible (`data-testid="venue-card-0"`).
    - Explicit `waitFor()` logic for hydration; do NOT rely on fixed timeouts.

## Implementation Tasks
- [ ] **Script: `e2e-guest-flow.ts`**
    - [ ] Clone `visual-verification.ts` logic as base.
    - [ ] Add interaction steps (Click, Wait for URL change).
    - [ ] Add assertion steps (Expect "Vibe Check" text).
- [ ] **CI/CD Prep**
    - [ ] Ensure script returns Exit Code 0 on Success, 1 on Fail.
    - [ ] (Future) Add to GitHub Actions pipeline.

## Dependencies
- B014 (Backend must be stable).
- B016 (UI should be polished enough to be testable with stable selectors).
