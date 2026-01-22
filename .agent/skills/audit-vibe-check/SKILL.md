---
name: audit-vibe-check
description: Verifies the real-time propagation of "Vibe" (scoring) from user action to UI update.
---

# Audit Vibe Check

Use this skill when asked to "audit the vibe", "verify propagation", or "check if the app is working".,

## 1. Reset State
First, ensure the environment is in a clean state to prevent false positives from previous tests.
```bash
npx tsx .agent/skills/audit-vibe-check/scripts/reset-vibe.ts
```

## 2. Execute Visual Audit (Browser Subagent)
Call the `browser_subagent` with the following Task:

"You are performing a Visual Audit of the OlyBars 'Vibe' system.
1. **Navigate**: Go to `http://localhost:3000/bars/brotherhood-lounge`.
2. **Context**: Ensure you represent a 'Guest' user (Login as Guest if needed, or clear cookies).
3. **Action**: Find and click the large 'Clock In' button.
    *   *Note: If prompted for location, attempt to Allow, or look for a 'Mock Location' toggle if available in the UI debug tools.*
4. **Verification (Critical)**:
    *   **Toast**: Confirm a notification appears saying '+10 Points' or similar.
    *   **Visuals**: Observe the changes on the page. Does the 'Buzz' meter increase?
    *   **Map**: Open `http://localhost:3000/map` in a new tab. Verify the pin for 'Brotherhood Lounge' has changed color (e.g., from Gray to Gold/Red).
5. **Report**: Take a screenshot of the Map and the Venue page. Report on the latency (did it feel instant?)."

## 3. Self-Correction
*   **If the map is blank**: The Map API key might be missing. Check the console logs.
*   **If 'Clock In' fails**: The Geolocation might be blocked. Try using the venue's specific 'Test Mode' if available, or report the blocker.
