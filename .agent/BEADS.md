# OlyBars Master Bead Backlog

> [!CRITICAL]
> **Orchestration Protocol**: This file is the **Single Source of Truth** for the project roadmap.
> *   **Granularity**: Large tasks must be broken down into atomic "Beads".
> *   **Dependency**: Do not start a Bead if its `Dependencies` are not `DONE`.
> *   **Locking**: Agents must create a lock file in `.agent/beads/claims/` before starting work.

## 🔗 Dependency Graph Overview
*   **Infrastructure (CORE)** -> **Backend (SEC/API)** -> **Frontend (UX/FE)**
*   **Hygiene (OPS)** must be maintained continuously (`check-health`).

---

## 1. Core Infrastructure & Ops (The Foundation)
*Building the machine that builds the product.*

| Priority | Bead ID | Status | Dependencies | Title | Description / Goals | Future Self Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | `CORE-01` | **DONE** | - | **Fresh Eyes Integration** | Establish self-correcting loop rules. | completed 2026-01-27 |
| **P0** | `CORE-02` | **DONE** | - | **Health Check CLI** | Interactive `check-health` script. | completed 2026-01-27 |
| **P0** | `CORE-03` | **DONE** | `CORE-02` | **Git Hook Steward** | Wire Husky pre-commit hooks. | completed 2026-01-27 |
| **P0** | `CORE-04` | **DONE** | `CORE-02` | **Remediation Playbook** | `npm run remediate` auto-fixer. | Interactive deletion logic is active. |
| **P1** | `CORE-05` | **DONE** | `CORE-04` | **Hygiene Score: 100/100** | Reach perfect score. | Unused components must be purged or ignored. |
| **P2** | `CORE-06` | **DONE** | `CORE-03` | **Test Coverage Gate** | Add unit tests to `check-health`. | Require >50% coverage in `hygiene-status.json`. |

## 2. Security & Backend (Schmidt Ops)
*Data integrity, permissions, and business logic.*

| Priority | Bead ID | Status | Dependencies | Title | Description / Goals | Future Self Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | `SEC-01` | **DONE** | - | **Persona Manifest** | Define Guest/Owner/Staff roles. | The "LeverageLoop" concept is defined here. |
| **P0** | `SEC-02` | **DONE** | `SEC-01` | **Frontend Guardrails** | `usePersona` hook for UI gating. | Never rely on client-side checks for security. |
| **P0** | `SEC-03` | **DONE** | `SEC-02` | **Backend Zero-Trust** | Firestore Rules & Middleware. | Middleware must reject invalid tokens 403. |
| **P1** | `API-01` | **CLAIMED** | `SEC-03` | **Strict Type Hardening** | `noImplicitAny` rollout. | A "Perfect Backend" has zero type gaps. |
| **P2** | `API-02` | **OPEN** | `API-01` | **Edge Caching** | CDN rules for public endpoints. | Cache public venue data for 60s. |

## 3. Frontend & Vibe (Visual/UX)
*The "Nightlife OS" experience. Glass, Motion, Tactility.*

| Priority | Bead ID | Status | Dependencies | Title | Description / Goals | Future Self Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P1** | `UX-01` | **DONE** | - | **Visual Core Upgrade** | Typography, Glass, Spacing Token. | "Don't animate chaos." Solidify `index.css`. |
| **P1** | `UX-02` | **OPEN** | `UX-01` | **Motion Language** | Page Transitions & Framer Motion. | Spatial logic: "Enter from right, exit to left". |
| **P2** | `UX-03` | **OPEN** | `UX-02` | **Interaction Fidelity** | Optimistic UI & Haptics. | Buttons must have `active:scale-95`. |
| **P2** | `UX-04` | **IN_PROGRESS** | `UX-01` | **Scraper Dashboard 2.0** | "Schmidt's Brain" UI. | Make the console feel like a hacking tool. |
| **P2** | `UX-05` | **OPEN** | `UX-01` | **Mobile-First Audit** | Touch targets (44px) & safe areas. | Test on iOS Safari (bottom bar issues). |

## 4. Scraper Ecosystem (Data Ingestion)
*The feed that powers the system.*

| Priority | Bead ID | Status | Dependencies | Title | Description / Goals | Future Self Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **P0** | `DATA-01` | **DONE** | - | **Scraper Foundations** | `Scraper` Schema definition. | V3R1 alignment. |
| **P1** | `DATA-02` | **DONE** | `DATA-01` | **AI Brain Expansion** | Gemini extraction logic. | Pass `extractionNotes` to context. |
| **P1** | `DATA-03` | **DONE** | `DATA-02` | **Scout Worker** | Distributed scraping jobs. | Persistence integrity check needed. |
| **P2** | `DATA-04` | **OPEN** | `DATA-03` | **Live Debugger** | Real-time scraper logs in UI. | Stream logs to `UX-04` dashboard. |

## 5. Completed / Archived
*Reference for historical context only.*

| Bead ID | Completed | Title |
| :--- | :--- | :--- |
| `SETUP-01`| 2024-01-27 | Initial Audit |
| `B001` | 2024-01-27 | Core Architecture Refactor |
