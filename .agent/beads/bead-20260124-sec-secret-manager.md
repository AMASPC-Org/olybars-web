---
status: done
agent: unassigned
type: security
priority: high
created: 2026-01-24
---

# Bead: Secret Manager Integration

## Context

Move sensitive environment variables from repo/disk to runtime-only injection via GCP Secret Manager.

## Acceptance Criteria

- [ ] Migrate `GOOGLE_BACKEND_KEY` and other sensitive env vars to GCP Secret Manager.
- [ ] Update Cloud Run service to mount secrets or inject as env vars.
- [ ] Update local dev to pull secrets or use a secure local-only method (not in git).
- [ ] **Verification:** Application boots and functions correctly without local `.env` files containing secrets.

## Resources

- Skill: `backend-systems`
- Doc: `docs/Technical_Debt.md`
