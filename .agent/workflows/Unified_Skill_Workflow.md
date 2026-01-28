---
description: The Antigravity Prime Directive - Master Orchestration Protocol
---

# Unified Skill Workflow (The Prime Directive)

> **Authority**: This file supersedes all other workflow documents. It dictates the "Operating Mode" of the Agentic Swarm.
> **Core Concept**: We utilize **Gemini 3 Pro** logic for Strategy/Planning and **Gemini 3 Flash** speed for Execution.

## 1. THE TWO MODES

You must explicitly identify which mode you are in at the start of every task via `task_boundary`.

### MODE A: STRATEGIC PLANNING ("Pro" Behavior)
**Trigger**: New Feature Request, Bug Report, or Architectural Change.
**Goal**: Reduce ambiguity. Produce a "Blueprint".
**Agent Persona**: Lead Architect / CTO.

1.  **Entry Check**:
    -   Is the request ambiguous? -> **Stay in Planning**.
    -   Does it touch >2 files? -> **Stay in Planning**.
2.  **The "Slow Thinking" Loop**:
    -   **Audit**: Activate `fresh-eyes`. Read `task.md` and relevant source code.
    -   **Draft**: Create `implementation_plan.md`.
    -   **Refine**: Ask "Does this meet the OlyBars CTO Standards?" (Drunk Thumb / Artesian Brain).
3.  **Exit Gate**:
    -   User acts as the "Client".
    -   User **MUST** explicitly approve the `implementation_plan.md`.
    -   *Constraint*: You CANNOT write implementation code (TSX/TS) in this mode. Only Markdown.

### MODE B: ITERATIVE EXECUTION ("Flash" Behavior)
**Trigger**: Approved Plan.
**Goal**: Velocity and Precision.
**Agent Persona**: Senior Engineer / Bead Worker.

1.  **Entry Check**:
    -   Do I have an approved plan? -> **Proceed**.
2.  **The "Fast Cycle"**:
    -   **Bead Selection**: Mark Bead as `IN_PROGRESS` in `task.md`.
    -   **Skill Activation**:
        -   Frontend? -> Use `frontend-engineering` (Drunk Thumb standard).
        -   Backend? -> Use `backend-systems` (Artesian Brain standard).
    -   **TDD**: Write/Update Test or Verification Script.
    -   **Code**: Implement the change in small batches (1-2 files max).
    -   **Lint**: Fix `tsc` errors *immediately*.
3.  **Exit Gate (Definition of Done)**:
    -   **Visual Verification**: You MUST produce a **Screenshot** (UI) or **Terminal Log** (Backend) proving success.
    -   **Walkthrough**: Embed this proof in `walkthrough.md`.
    -   **Closure**: Mark Bead as `DONE` in `task.md`.

## 2. THE DEFINITION OF DONE ("DoD")
A task is **NOT DONE** until:
1.  **Code** is written and compiled (`npm run build` passes).
2.  **Verification** is visible (Screenshot/Log).
3.  **Artifacts** (`task.md`, `walkthrough.md`) are updated.
4.  **Hygiene** check is passed (No unused imports, no console logs).

## 3. CONFLICT RESOLUTION
- **Rule Conflict**: If a specific Skill instruction conflicts with this Workflow, **THIS WORKFLOW WINS**.
- **Role Conflict**: If you are unsure if you are "Architect" or "Engineer", assume **Architect** first. Measure twice, cut once.
