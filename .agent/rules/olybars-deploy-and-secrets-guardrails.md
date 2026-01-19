# OlyBars Deploy & Secrets Guardrails

Apply this rule to any task involving: deploy/release, Cloud Run, Firebase, Functions, Secret Manager, IAM, or environment variables.

## Golden rule
No deploy proceeds if required env vars/secrets are missing or runtime identity lacks access.

## Drift Guardrail (required)
1) Scan server/ (and functions/ if present) for `process.env.*` usage.
2) Fetch live Cloud Run service config as JSON:
   - `gcloud run services describe ... --format=json`
3) Extract runtime-provided variable names from:
   - container env var list
   - secret-backed env var references
4) Compare REQUIRED vs CONFIGURED.
5) If anything is missing: write `deployment_drift_<env>.md` and STOP.

## Secret remediation policy
- Provide commands to fix (create secret, bind IAM, attach to service).
- Do NOT execute IAM/secret writes without explicit user approval (Request Review).

## Prevent wrong-target deploys
When deploying to dev:
- Look for hardcoded prod IDs (e.g., "ama-ecosystem-prod") in deploy scripts/config.
- If found: STOP and flag it as a release-blocker.

## Post-deploy verification (required)
- Smoke test via curl.exe
- Confirm Cloud Run revision ready
- Confirm Hosting rewrite routes to backend (if applicable)
Capture output into `smoke_test_<env>.log`.
