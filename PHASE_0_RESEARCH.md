# PHASE 0: Research & Context

## 1. Project Overview & Context
*   **Project Name:** OlyBars (`olybars-production`)
*   **Architecture:** Hybrid Firebase + Cloud Run (Serverless Monolith)
*   **Repository:** Monorepo-style (Frontend `src/`, Backend `server/`, Functions `functions/`)

## 2. Technology Stack Analysis
### Frontend
*   **Framework:** React 18 (Vite)
*   **Styling:** Tailwind CSS
*   **State/Data:** `react-query` + `react-firebase-hooks`
*   **Build Artifact:** Static files in `dist/`

### Backend (API)
*   **Service:** Cloud Run (`olybars-backend`)
*   **Framework:** Express.js (Node 20)
*   **Entry Point:** `server/src/index.ts`
*   **Routing:** `/api/*` traffic is proxied from Firebase Hosting to this service.

### Backend (Edge/Triggers)
*   **Service:** Firebase Cloud Functions (`functions/`)
*   **Triggers:** Firestore triggers, scheduled tasks, and specific HTTP endpoints (`artieChat`).

### Infrastructure & Data
*   **Database:** Cloud Firestore (NoSQL)
*   **Auth:** Firebase Authentication
*   **Hosting:** Firebase Hosting (CDN + Rewrites)
*   **Region:** `us-west1` (Strict Requirement)

## 3. Toolchain & Environment
*   **Node Version:** >=20.0.0
*   **PackageManager:** npm
*   **Scripts:**
    *   `npm run dev:all`: Full stack local development (Frontend + Backend + Emulators).
    *   `npm run deploy:dev`: Deploy to Dev/Staging (`ama-ecosystem-dev-9ceda`).
    *   `npm run deploy:prod`: Deploy to Production (`ama-ecosystem-prod`).

## 4. Initial Assessment
*   **Readiness:** The project has established build/deploy scripts.
*   **Complexity:** High. Hybrid architecture requires careful local emulation (Frontend + Backend + Emulators).
*   **Risks:**
    *   Port conflicts (Frontend 5173, Backend 3000, Emulators 8080/4000/etc).
    *   Env Var drift between Local/Dev/Prod.
    *   "Works on my machine" syndrome due to Cloud Run environment differences.

## 5. Next Steps (Phase 1)
1.  **Strictly verify `npm run dev:all`**: Ensure all services (Vite, Express, Emulators) start without errors.
2.  **Smoke Test**: Curl localhost endpoints to verify `server/` is reachable.
3.  **UI Verification**: Browser test to login and load initial data.
