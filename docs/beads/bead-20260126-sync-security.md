# Bead: Identity Restoration (Security)
> **Context:** Fixing "Sync & Deploy" death loop. Phase 1: Security.
> **Goal:** Ensure GitHub Actions can authenticate and deploy to Cloud Run.

## Status: Open

## Tasks
- [x] **Audit IAM Roles** <!-- id: 1 -->
    - Verify `github-deployer@ama-ecosystem-dev-9ceda.iam.gserviceaccount.com` has:
        - `roles/run.admin`
        - `roles/iam.serviceAccountUser`
        - `roles/secretmanager.secretAccessor`
- [x] **Verify Secrets (The Mapping Trap)** <!-- id: 2 -->
    - Verify `INTERNAL_HEALTH_TOKEN` exists in GCP Secret Manager.
    - Confirm GitHub Secret `DEV_INTERNAL_HEALTH_TOKEN` maps correctly in workflow.
- [x] **Manual WIF Test** <!-- id: 3 -->
    - Execute `gh workflow run verify-wif.yml`.
    - Analyze logs for successful OIDC token exchange.

## Status: Closed
<!-- Completed 2026-01-26: WIF Verified, IAM Audited (github-deployer has admin), Token in Secret Manager -->
