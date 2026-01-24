---
status: open
agent: unassigned
type: security
priority: high
created: 2026-01-24
---

# Bead: Workload Identity Federation (GitHub Actions)

## Context

Eliminate long-lived JSON service account keys in CI/CD pipelines to prevent credential leaks.

## Acceptance Criteria

- [ ] configure GitHub Actions to authenticate via OpenID Connect (OIDC) directly to GCP.
- [ ] Remove `GOOGLE_CREDENTIALS` (JSON) from GitHub Secrets.
- [ ] **Verification:** Successful deploy pipeline run without using a JSON key.

## Resources

- Skill: `backend-systems`
- Doc: `docs/Technical_Debt.md`
