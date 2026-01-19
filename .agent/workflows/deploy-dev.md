# deploy-dev
Deploy to dev with guardrails and verification.

## Steps
1) Run /drift-guardrail-dev
   - If it fails, STOP.

2) Run dev deploy command (repo standard):
   - Prefer `npm run deploy:dev`
   - Capture terminal output to `deploy_dev.log` (or embed key excerpts into report)

3) Verify health:
   - curl.exe the Firebase Hosting rewrite endpoint (if configured) AND direct Cloud Run URL
   - Save outputs to `smoke_test_dev.log`

4) Produce `deploy_report_dev.md`:
   - What changed (git summary)
   - Deploy command used + result
   - URLs tested + pass/fail
   - Any warnings (e.g., wrong-target scripts, missing FRONTEND_URL)
