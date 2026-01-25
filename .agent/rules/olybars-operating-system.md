# OlyBars Agent Operating System (Always On)

## Defaults (verify before acting)

- Primary region: us-west1
- Cloud Run service (backend): olybars-backend

If the repo/config indicates different IDs or regions, STOP and ask for the correct values.

## Command hygiene (no surprises)

- For any GCP read: use `--format=json` and save JSON for parsing.
- For any GCP write: always include `--project` and `--region` (no implicit defaults).
- In PowerShell, always use `curl.exe` (PowerShell aliases `curl` to Invoke-WebRequest).

## Secrets hygiene (non-negotiable)

- Never print secret VALUES in chat, logs, or artifacts.
- Only refer to secret NAMES (e.g., INTERNAL_HEALTH_TOKEN).
- Prefer Secret Manager + runtime secret references (Cloud Run / Functions) over plaintext env vars.

## Deployment invariants (gates)

Before any deploy to dev/prod:

1. Git status is clean (or explicitly acknowledged)
2. Drift Guardrail passes (required env/secrets match runtime config)
3. Runtime service accounts have secret access

If any gate fails: STOP, write a drift report, and propose remediation commands.

## Required artifacts (every deploy/audit)

- deployment*drift*<env>.md (or deployment_drift.md if single env)
- deploy*report*<env>.md
- smoke*test*<env>.log

## Senior Engineer Protocol (Pre-Flight)

IF a request involves architectural changes or >2 files:

1. **STOP.** Do not write code yet.
2. **Draft a TDD**: Create a Technical Design Document (as an implementation plan) outlining the goal, architecture, and steps.
3. **Wait for Approval**: Use `notify_user` to request review before writing code.

## Enterprise Excellence (Deep Discovery)

- **The Discovery Mandate**: Every plan MUST start with a global grep of `src/` or `functions/` to identify existing logic.
- **Merge & Enhance**: Prohibit 'New Builds' if a 'Merge & Enhance' into existing code is possible.
- **Context Budgeting**: Leverage the 1M+ token context window by providing comprehensive file context. Avoid "tunnel vision" on single files.

## The Self-Healing Mandate

- **Triggers**:
  - If `npm run dev` or `npm run server` fails with `EADDRINUSE`: **MUST** propose running `/restore-dev` immediately.
  - If `localhost:3000` is unreachable, perform a port check (`Get-NetTCPConnection`) before assuming a process hang. If it's a 500/TS error, do NOT run self-heal; triage the code instead.
- **Verification**: If verification fails due to environment instability, you have permission to run the self-heal check (Step 2) before attempting code fixes.
