# Bead: CORE-03 - Git Hook Gatekeeper (The Steward)

> **Status**: OPEN
> **Priority**: P0 (Critical Infrastructure)
> **Type**: Developer Experience (DX) / Security
> **Owner**: @Agent
> **Estimated Effort**: Low (Code) / High (Nuance)
> **Dependencies**: CORE-02 (Health Check CLI)

## Context
We have built `scripts/check-health.ts` (CORE-02), a CLI tool that verifies project hygiene. Now we must wire it into the Git lifecycle (`pre-commit`). This needs to be done delicately. A naive implementation (just adding `npm run check:health`) will cause "Hanging Commits" in GUI clients like VSCode/SourceTree, which don't support interactive prompts. This leads to developer frustration and users disabling hooks entirely.

## The Vision: "Stripe-Level" Developer Experience
A "Stripe-level" tool feels like a partner, not a blocker.
1.  **Invisible when Good**: If hygiene is high, it shouldn't say a word.
2.  **Helpful when Bad (TTY)**: If hygiene is low in a terminal, it offers an *immediate* fix.
3.  **Predictable when Bad (GUI)**: If hygiene is low in a GUI, it fails *fast* with a clear error message, rather than hanging forever.

## Goals
1.  **The Gatekeeper**: Enforce `check:health` before `lint-staged`.
2.  **The Dirty Write Contract**: Explicitly allow `check:health` to modify `hygiene-status.json` (via Janitor) without staging the change. This leaves the working tree "dirty" after commit, which is a signal to the developer.
3.  **GUI Safety**: Ensure the script currently detects TTY correctly (already done in CORE-02, but verification is key).

## Implementation Details

### 1. Husky Configuration
*   **File**: `.husky/pre-commit`
*   **Logic**:
    ```sh
    #!/usr/bin/env sh
    # 1. Health Check (The Gatekeeper) - Fast Fail / Interactive Fix
    npm run check:health
    
    # 2. Linting (The Polisher) - Only runs if Health is Good
    npx lint-staged
    ```

### 2. The "Dirty Write" Edge Case
*   **Scenario**: User commits. Report is stale. User clicks "Y" to fix. Janitor runs. `hygiene-status.json` updates.
*   **The Conflict**: The commit proceeds with the *old* (stale/missing) status file in the commit snapshot, but the *new* file on disk.
*   **The Decision**: This is **ACCEPTABLE**.
    *   *Alternative*: Auto-add the file (`git add hygiene-status.json`).
    *   *Rejection*: Auto-adding is "Magic". It might include unintended changes.
    *   *Preference*: "Predictability". The user sees a modified file after commit and knows "Ah, the Janitor ran."
    *   *Refinement*: The script MUST print a message: `pc.yellow('⚠ Hygiene report updated on disk. Amend commit if desired.')`.

## Verification Test Matrix
| Environment | State | Expected Behavior |
| :--- | :--- | :--- |
| **Terminal** | Healthy | Silent success. |
| **Terminal** | Unhealthy | Interactive Prompt: "Fix? (Y/n)". |
| **VSCode Git**| Healthy | Silent success. |
| **VSCode Git**| Unhealthy | **Exit 1**. Output: "Error: Hygiene report missing. Run janitor." |

## Future Self Notes
*   **Bypass**: Remember `git commit --no-verify` (or `-n`) skips this entirely.
*   **Performance**: `check:health` reads one JSON file. It is <10ms. It will not slow down the feedback loop.
