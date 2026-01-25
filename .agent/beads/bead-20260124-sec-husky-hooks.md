---
status: Complete
agent: AGV2
type: security
priority: medium
created: 2026-01-24
---

# Bead: Pre-Commit Hooks (Husky)

## Context

prevent accidental commits of secrets (JSON keys, high entropy strings) using git hooks.

## Acceptance Criteria

- [ ] Install `husky` and `lint-staged`.
- [ ] Add `pre-commit` hook to scan for `*.json` (in sensitive paths), `.pem`, and `AIza...` strings.
- [ ] **Verification:** Attempt to commit a dummy secret file and verify the commit is blocked.

## Resources

- Skill: `backend-systems`
- Doc: `docs/Technical_Debt.md`
