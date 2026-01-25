---
status: Complete
agent: AGV1
type: bug
priority: critical
created: 2026-01-24
---

# Bead: Debug Owner Dashboard 401s

## Context

Venue Owners getting `401 Unauthorized` when fetching private data. Suspect token mismatch in `authMiddleware.ts`.

## Acceptance Criteria

- [ ] Reproduction of 401 error via `curl` or test.
- [ ] Fix applied to `src/middleware/authMiddleware.ts`.
- [ ] **Verification:** Terminal log showing `200 OK` on `/api/venues/hannahs/private`.

## Resources

- Skill: `backend-systems`
