---
trigger:
  type: glob
  pattern: "*"
---

# System Glossary: The Two Layers

This document is the **Absolute Source of Truth** for distinguishing between the **Engineering Layer (Antigravity)** and the **Product Layer (OlyBars)**.

## Layer 1: Antigravity (The Engineer's World)
*Context: How we build the software.*

*   **Agent**: The AI entity (you) operating within the Antigravity framework.
    *   *Example*: "Agent Z9X1 claiming a bead."
*   **Agent Skill**: A capability folder in `.agent/skills/` that provides instructions to the Agent.
    *   *Example*: `frontend-engineering`, `bead-worker`, `data-architecture`.
    *   *Usage*: "I am activating the `bead-worker` skill to manage the backlog."
*   **Workflow**: A procedural guide in `.agent/workflows/` for repeating complex engineering tasks.
    *   *Example*: `/restore-dev`, `/master-sync`.
*   **Rule**: Governance files in `.agent/rules/` that constrain the Agent's behavior.
    *   *Example*: `terminology-guard.md`, `artie-shield.md`.

## Layer 2: OlyBars (The User's World)
*Context: What the software does.*

*   **Persona**: The fictional characters inside the application.
    *   **Artie**: The "Spirit of the Well" (Visitor Guide).
    *   **Schmidt**: The "Manager's Coach" (Ops & Growth).
*   **Persona Skill**: A specific business logic handler in `src/skills/Schmidt/`.
    *   *Example*: `flashDeal.ts` (Schmidt's ability to schedule a bounty).
    *   *Usage*: "The `useSchmidtOps` hook routes the 'flash_deal' action to the `SchmidtBounty` handler."
*   **Bead**: A unit of work/mission in the OlyBars project backlog (`docs/beads/`).
    *   *Lifecycle*: Create $\rightarrow$ Refine $\rightarrow$ Claim (.lock) $\rightarrow$ Complete.
    *   *Purpose*: Coordinate multiple Agents working on the same project.

## Disambiguation Table

| Term | Engineering Layer (Antigravity) | Product Layer (OlyBars) |
| :--- | :--- | :--- |
| **"Skill"** | A folder of instructions for **YOU** (the coder). | A TypeScript file defining what **SCHMIDT** (the app) can do. |
| **"Agent"** | **YOU** (The AI coding assistant). | **Schmidt/Artie** (The in-app chatbots). |
| **"Task"** | A checklist item in `task.md`. | A "Bounty Task" for a user in the bar. |
| **"Mission"** | The overall goal of a Bead. | A specific Schmidt gamification challenge. |

## Critical Constraints
1.  **Never Conflate**: Do not use "Agent Skill" when referring to `src/skills/Schmidt/`.
2.  **Explicit Context**: When discussing "Skills," always prefix with "Antigravity" or "Persona" if the context is ambiguous.
3.  **Forbidden Term**: "Pulse Control" (Misused term). Use **"Vibe Management"** or **"Ops Dashboard"**.
