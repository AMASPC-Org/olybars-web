---
status: done
agent: AGV2
type: security
priority: high
created: 2026-01-24
---

# Bead: Workload Identity Federation (GitHub Actions)

## Context

Eliminate long-lived JSON service account keys in CI/CD pipelines to prevent credential leaks.

## Technical Plan (Zero-Fail Strategy)

### 1. Discovery & Validation (The "Dry Run")

- **Identify Target Service Account**: We must identify the actual Service Account email (likely `github-actions@ama-ecosystem-prod.iam.gserviceaccount.com` or similar) that `secrets.PROD_WIF_SERVICE_ACCOUNT` points to.
- **Pool Verification**: Confirm `github-pool` is active. (DONE)
- **IAM Binding Check**: Verify the Service Account has the policy binding:
  - **Role**: `roles/iam.workloadIdentityUser`
  - **Member**: `principal://iam.googleapis.com`
    `/projects / 26629455103 / locations / global / workloadIdentityPools / github-pool`
    `/subject/repo:AMASPC-Org/olybars:ref:refs/heads/main` (for Prod)
  - _Correction_: We can also use `principalSet://` ... `/attribute.repository/AMASPC-Org/olybars` to allow all branches from this repo. We must confirm which strategy is in use.

### 2. Implementation Logic

- **Action Update**: The workflows (`reusable-deploy.yml`) already implement `google-github-actions/auth`.
- **Firebase Auth Bridge**: `firebase-tools` (installed via `npm install -g`) automatically detects `GOOGLE_APPLICATION_CREDENTIALS` set by the Google Auth action. No custom token minting required.
- **Service Account Impersonation**: The action physically impersonates the Service Account. We must verify the SA has `roles/firebase.admin` and `roles/cloudrun.admin`.

### 3. Verification Protocol (The "Smoke Test")

Before deleting any secrets:

1.  **Secret Audit**: Verify `DEV_WIF_PROVIDER` and `DEV_WIF_SERVICE_ACCOUNT` are populated in GitHub Secrets.
2.  Create a temporary branch `chore/verify-wif`.
3.  Add a workflow `.github/workflows/verify-wif.yml` that runs `gcloud auth print-identity-token` and `firebase projects:list`.
4.  **Log Identity**: The workflow must explicitly log the authenticated identity to confirm it matches the target Service Account.
5.  Trigger manually.
6.  If successful, we have "Proof of Life" to proceed with key deletion.

## Acceptance Criteria

- [ ] **Infrastructure**: WIF Pool & Provider confirmed correctly configured.
- [ ] **IAM**: Service Account allows masquerading from `AMASPC-Org/olybars`.
- [ ] **Validation**: `verify-wif.yml` passes green.
- [ ] **Cleanup**: `GOOGLE_CREDENTIALS` JSON removed from GitHub Secrets.

## Resources

- Skill: `backend-systems`
- Doc: `docs/Technical_Debt.md`
