# drift-guardrail-prod
Detect env/secrets drift for PROD and stop if missing.

## Steps
1) Confirm target:
   - project: ama-ecosystem-prod
   - region: us-west1
   - service: olybars-backend

2) Scan repo for required env vars:
   - Search server/ (and functions/ if present) for `process.env.*`
   - Produce a unique list of REQUIRED keys (strip `process.env.`).

3) Fetch live Cloud Run config as JSON:
   - gcloud run services describe olybars-backend --project ama-ecosystem-prod --region us-west1 --format=json
   - Save to .agent/tmp/cloudrun.prod.json

4) Extract provided keys from JSON:
   - container env var names
   - secret-backed env names (env[].valueFrom.secretKeyRef)

5) Compare REQUIRED vs PROVIDED:
   - If missing: write `deployment_drift_prod.md` listing missing keys and STOP.
   - If match: write `deployment_drift_prod.md` stating PASS.

6) Also capture runtime identity:
   - Cloud Run serviceAccountName from JSON
   - Note it in the report (for IAM remediation if needed).
