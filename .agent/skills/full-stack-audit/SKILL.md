---
name: full-stack-audit
description: comprehensive full-stack audit of the local OlyBars development environment to verify the real-time 'Vibe' propagation logic.
---

# Full-Stack Audit: Vibe Propagation

This skill outlines the procedure to audit the 'Clock In' flow and its real-time propagation across the OlyBars UI.

## 1. Environment Setup
- **Pre-requisite**: Ensure the local development server is running (`npm run dev:all`).
- **User Role**: League Player (This requires an authenticated state, likely needing a 'Member' persona login or emulation).

## 2. Audit Steps

### Step 1: Baseline Observation
1.  **Navigate** to a Venue Profile (e.g., `/bars/the-brotherhood`).
2.  **Observe** the current 'Buzz' level and 'Vibe' report on the Venue Profile.
3.  **Check** the global 'Buzz Clock' (usually in the header or dashboard).

### Step 2: Action - Clock In
1.  **Locate** the 'Clock In' button (League Passport area or Venue Profile action bar).
2.  **Execute** 'Clock In'.
    *   *Note*: If geolocation is required, you may need to mock the coordinates or use the browser's sensor overrides if available, or ensure the dev environment allows 'Clock In' without strict geo-fencing (often acceptable in typical dev builds, otherwise use `lat_lng` override).
3.  **Context**: "I am at The Brotherhood and I am clocking in."

### Step 3: Verification (Real-Time)
**CRITICAL**: Do NOT reload the page.
1.  **Buzz Clock**: assert that the user's points/status updated immediately (e.g., +10 pts).
2.  **Venue Profile**: assert that the 'Buzz' meter/indicator for the venue reflects the new activity (e.g., Heat goes up, or "Just Now" activity logs).
3.  **Map**: (Optional/If visible) Check if the venue pin pulses or changes color.

### Step 4: Latency Check
-   If the UI updates take > 5 seconds, this is a **FAILURE**.
-   Open the **Browser Console** and look for:
    -   Firestore permission errors.
    -   Network timeouts.
    -   WebSocket disconnections.

## 3. Reporting
-   Record a video of the session.
-   Log start time and end time of the 'Clock In' action to UI update.
-   Note any discrepancies between expected Vibe logic (System Arch) and observed behavior.
