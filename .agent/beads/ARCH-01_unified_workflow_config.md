# Bead: ARCH-01 - Unified Workflow & Configuration Convergence

> **Status**: OPEN
> **Priority**: Critical (P0)
> **Type**: Configuration / DevEx
> **Dependencies**: None
> **Estimated Effort**: Medium

## Context
Our project currently suffers from "Instruction Drift". We have Logic defined in `.agent/rules/`, duplicated in `.agent/workflows/`, and partially implemented in `.agent/skills/`. This overlap confuses the Agentic Swarm, leading to inconsistent behaviors (sometimes it checks `janitor`, sometimes it doesn't). To achieve "Antigravity" efficiency, we must declare a Single Source of Truth.

## Goals
1.  **Consolidate Logic**: Deprecate "Micro-Workflows" that are better handled by "Macro-Skills".
2.  **Unify Deployment**: Merge `deploy-dev` and `deploy-prod` into a single, guardrailed `master-deploy` workflow.
3.  **Establish Prime Directive**: Create `Unified_Skill_Workflow.md` to formally define the "Pro vs Flash" operating modes.

## Implementation Details
1.  **Workflow Deprecation**:
    -   Archive `ship_feature.md` (Redundant with `feature-lifecycle`).
    -   Archive `audit-vibe.md` (Redundant with `audit-vibe-check` skill).
    -   *Action*: Move these files to a `_archive` folder or delete them.
2.  **Deployment Convergence**:
    -   Create `c:\Users\USER1\olybars\.agent\workflows\master-deploy.md`.
    -   This workflow must strictly call the `deploy-guardrail` skill before running `firebase deploy`.
3.  **The "One Ring" Artifact**:
    -   Create `c:\Users\USER1\olybars\.agent\workflows\Unified_Skill_Workflow.md`.
    -   **Content**: Explicitly define the "Planning Loop" (Gemini Pro) vs "Execution Loop" (Gemini Flash).
    -   **Mandate**: Visual Verification (Screenshots/Logs) as the ONLY valid Definition of Done.

## Future Self Notes
> "If you find yourself creating a 'Quick Rules' file, STOP. Add it to the Unified Workflow or a specific Skill. Do not fracture the knowledge base."

## Acceptance Criteria
- [ ] `Unified_Skill_Workflow.md` exists and is referenced in `settings.json`.
- [ ] `ship_feature.md` and `audit-vibe.md` are removed/archived.
- [ ] `master-deploy.md` handles both Dev/Prod with env flags.
