# OlyBars Unified Health "Vibe" Propagation Test (Manual)

When invoked, perform the Multi-Tab Functional Test and produce a screen recording.

## Multi-Tab Functional Test
Tab 1 (Observer):
- Open Venue Profile view and keep it visible.

Tab 2 (Actor):
- Ensure Auth is valid (log in if needed).
- Set Geolocation as required by the app.
- Perform "Clock In".

Constraint:
- After clocking in, WAIT up to 15 seconds for Tab 1 to reflect the update (Cloud Run cold start allowance).

## Evidence & artifacts
- Create/attach a screen recording showing the whole flow.
- Write a short report: `unified_health_audit_<env>.md`
  - URLs tested
  - user used (redact any secrets)
  - observed propagation timing (seconds)
  - pass/fail + screenshots if needed
