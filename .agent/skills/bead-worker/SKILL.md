---
name: bead-worker
description: Coordination skill for parallel agent swarms. Use this to claim, execute, and report on project "Beads".
---

# OlyBars Bead-Worker Protocol

## 1. Identity

Upon activation, generate a unique 4-character ID (e.g., `Z9X1`). Use this in all files you create.

## 2. Discovery & Claiming (Master List Protocol)

> [!IMPORTANT]
> **Source of Truth**: `.agent/BEADS.md`

- **Read**: Parse `.agent/BEADS.md` table. Look for rows with `Status: OPEN`.
- **Select**: Pick the highest priority (P0 -> P1).
- **Claim**:
    1.  **Update List**: Edit `.agent/BEADS.md` and change status to `IN_PROGRESS` and Owner to `@{YourID}`.
    2.  **Create Lock**: Create an empty file at `.agent/beads/claims/{BeadID}.lock`.
        - *Content*: `{AgentID} {Timestamp}`
    3.  **Verify**: If the lock file creation fails (exists), someone beat you to it. Revert the markdown and pick another.

## 3. The "Drunk Thumb" Mandate

All frontend work must be verified:

- High contrast (WCAG AAA preferred).
- Large touch targets (min 44x44px).
- Mobile-first layout.
- **Proof**: No `status: done` without a screenshot or terminal verification log.

## 4. Reporting (Agent Mail)

Do not append to a single log. Create a new file for every update:
`.agent/mail/{AgentID}-{Timestamp}.msg`

## 5. Completion
- **Update List**: Change status to `DONE` or `REVIEW` in `.agent/BEADS.md`.
- **Release Lock**: Delete `.agent/beads/claims/{BeadID}.lock`.
