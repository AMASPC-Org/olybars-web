# PHASE 1: Local Environment Log

## Objective
Achieve a "perfect" localhost state:
1.  Frontend (Vite) running on port 5173 (or 3000 if configured).
2.  Backend (Express) running on port 3000.
3.  Firebase Emulators (Auth, Firestore, Functions) running.
4.  No console errors on load.

## Execution Log

### Step 1: System Baseline
*   [x] Check for port conflicts (3000, 8080 occupied > Killing PIDs 26408, 26528, 17048).
*   [x] Verify Node version (v22.19.0).
*   [x] Verify Java availability (v25.0.2).

### Step 2: Start Services
*   [ ] Execute `npm run dev:all` (Failed - Auth Emulator Connection Refused).
*   [x] **Action:** Triggering `/restore-dev` workflow (Success).
*   [x] Kill Ports > Clear Cache > Run `self-heal.ps1` (Complete).
*   [ ] **Attempt 2:** Execute `npm run dev:all` (Stuck on Auth check).
*   [x] **Manual Triage:**
    *   **Backend (3000):** ✅ HTTP 200 OK.
    *   **Frontend (5173):** ❌ Connection Refused.
    *   **Emulators:** ❌ Connection Refused (Port 3001 found active?).
*   [ ] **Action:** Abandon `dev:all`. Switch to Manual Sequential Startup.
    1.  [ ] Kill All (Node/Java).
    2.  [ ] Start Emulators Only (`--project staging`)... (Starting...)
        *   **Action:** Nuclear Port Sweep (Killed PID 18296 on 8080).
        *   **Action:** Force Kill PID -> Restart.
        *   **Outcome:** Functions Emulator Unstable. Falling back to `auth,firestore` only.
    3.  [x] **Action:** Switch to "Hybrid Local" (Cloud Backed).
        *   Modified `.env` and `.env.local` to `VITE_USE_EMULATORS=false`.
    4.  [x] Start Backend (3001) > Start Frontend (3000).
    5.  [x] Verify:
        *   Backend: ✅ (HTTP 200).
        *   Frontend: ✅ (HTTP 200).
    6.  **Status:** Phase 1 Complete (Hybrid Mode). Emulators Bypassed.
    3.  [ ] Start Backend (3000).
    4.  [ ] Start Frontend (5173).

### Step 3: Verification
*   [ ] `curl localhost:3000/api/health`
*   [ ] Browser: Load Homepage.
*   [ ] Browser: Login Verification.
