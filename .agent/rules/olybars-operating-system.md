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
1) Git status is clean (or explicitly acknowledged)
2) Drift Guardrail passes (required env/secrets match runtime config)
3) Runtime service accounts have secret access

If any gate fails: STOP, write a drift report, and propose remediation commands.

## Required artifacts (every deploy/audit)
- deployment_drift_<env>.md (or deployment_drift.md if single env)
- deploy_report_<env>.md
- smoke_test_<env>.log
