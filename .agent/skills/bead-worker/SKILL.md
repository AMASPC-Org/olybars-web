---
name: bead-worker
description: Coordination skill for parallel agent swarms. Use this to claim, execute, and report on project "Beads".
---

# OlyBars Bead-Worker Protocol

## 1. Identity

Upon activation, generate a unique 4-character ID (e.g., `Z9X1`). Use this in all files you create.

## 2. Discovery & Claiming (Atomic Lock)

- **Search:** Run `list_dir` on `.agent/beads/`. Ignore any file with a corresponding `.lock` in `.agent/beads/claims/`.
- **Stat Check:** Explicitly `view_file` the bead to confirm it is `status: open` before attempting to claim.
- **Claim:** Use `write_to_file` with `Overwrite=false` to create `.agent/beads/claims/{bead_name}.lock`.
- **Content:** Write `{AgentID} {Timestamp}` inside the lock file to aid debugging.
- **Collision:** If the tool returns a "File already exists" error, the bead is taken. IMMEDIATELY pick a different bead.
- **Marking:** Once locked, update the status in the main `.md` bead file to `status: claimed` and `agent: {YourID}`.

## 3. The "Drunk Thumb" Mandate

All frontend work must be verified:

- High contrast (WCAG AAA preferred).
- Large touch targets (min 44x44px).
- Mobile-first layout.
- **Proof:** No `status: done` without a screenshot or terminal verification log.

## 4. Reporting (Agent Mail)

Do not append to a single log. Create a new file for every update:
`.agent/mail/{AgentID}-{Timestamp}.msg`
