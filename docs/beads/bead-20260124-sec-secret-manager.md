# Bead: Secret Manager Integration

**ID:** bead-20260124-sec-secret-manager
**Status:** Completed
**Owner:** Antigravity

## Context

We are hardening the OlyBars security posture by strictly enforcing the use of GCP Secret Manager for all backend secrets. This ensures that sensitive API keys (Gemini, Google Maps Backend) are never exposed in the codebase or environment configuration files committed to Git.

## Objectives

1.  **Audit Secrets**: Identify all secrets currently used in `.env` and `functions/src/index.ts`.
2.  **Migrate to GCP**: Ensure `GOOGLE_GENAI_API_KEY`, `GOOGLE_BACKEND_KEY`, and `INTERNAL_HEALTH_TOKEN` are populated in GCP Secret Manager.
3.  **Codebase Compliance**: Verify `functions/src/index.ts` correctly requests these secrets.
4.  **Local Dev Compatibility**: Ensure `envLoader.ts` or the Firebase Emulator correctly injects these secrets during `npm run dev`.

## Execution Plan

### 1. Audit & verification

- [ ] Review `functions/src/index.ts` for secret definitions.
- [ ] Review `.env.example` vs `.env` (local).

### 2. Implementation

- [ ] Verify `functions/src/index.ts` uses `secrets` configuration.
- [ ] Create/Verify secrets in GCP Secret Manager (via instruction or verification command).
  - Note: As an AI, I cannot see GCP Console, so I will generate the `gcloud` commands for the user to run or verify.
- [ ] Update `envLoader.ts` if necessary to ensure it doesn't conflict with native secret handling.

### 3. Verification

- [ ] Run `npm run dev` and ensure functions start without secret errors.
- [ ] Verify `artieChat` function can access `GOOGLE_GENAI_API_KEY`.

## Reference

- [Google Cloud Secret Manager](https://cloud.google.com/secret-manager/docs)
- [Firebase Functions Secrets](https://firebase.google.com/docs/functions/config-env)
