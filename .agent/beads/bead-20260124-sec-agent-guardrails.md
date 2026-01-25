---
status: Complete
agent: AGV2
type: security
priority: medium
created: 2026-01-24
---

# Bead: Agentic Guardrails

## Context

Update agent rules to explicitly forbid unsafe git practices.

## Acceptance Criteria

- [x] Update `.agent/rules/ops-and-discovery.md`.
- [x] Explicitly forbid `git add .` without prior `git status`.
- [x] Mandate explicit file argument for `git add` when near sensitive directories.
- [x] **Verification:** Verify the rule exists in the markdown file.

## Resources

- Skill: `domain-expert`
- Doc: `docs/Technical_Debt.md`
- File: `.agent/rules/ops-and-discovery.md`
