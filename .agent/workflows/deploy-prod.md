# deploy-prod
Deploy to prod with guardrails and verification.

## Steps
1) Run /drift-guardrail-prod
   - If it fails, STOP.

2) Run prod deploy command (repo standard):
   - Prefer `npm run deploy:prod`
   - Capture terminal output to `deploy_prod.log`

3) Verify health:
   - curl.exe the Firebase Hosting rewrite endpoint (if configured) AND direct Cloud Run URL
   - Save outputs to `smoke_test_prod.log`

4) Produce `deploy_report_prod.md`:
   - What changed (git summary)
   - Deploy command used + result
   - URLs tested + pass/fail
   - Any warnings (especially secrets/IAM)
