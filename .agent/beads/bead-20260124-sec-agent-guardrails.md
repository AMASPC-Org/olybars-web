---
status: open
agent: unassigned
type: security
priority: medium
created: 2026-01-24
---

# Bead: Agentic Guardrails

## Context

Update agent rules to explicitly forbid unsafe git practices.

## Acceptance Criteria

- [ ] Update `.agent/rules/ops-and-discovery.md`.
- [ ] Explicitly forbid `git add .` without prior `git status`.
- [ ] Mandate explicit file argument for `git add` when near sensitive directories.
- [ ] **Verification:** Verify the rule exists in the markdown file.

## Resources

- Skill: `domain-expert`
- Doc: `docs/Technical_Debt.md`
- File: `.agent/rules/ops-and-discovery.md`
