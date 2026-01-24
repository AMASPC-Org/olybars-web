---
status: done
agent: AGV1
type: ui
priority: medium
created: 2026-01-24
---

# Bead: Missing Logo in Header

## Context

The top-left logo is broken. Likely a path issue (`/assets/logo.svg` vs `public/logo.png`).

## Acceptance Criteria

- [ ] Logo file exists in `public/`.
- [ ] `Header.tsx` uses correct absolute path.
- [ ] **Verification:** Mobile-view screenshot of the header (Drunk Thumb check).

## Resources

- Skill: `frontend-engineering`
