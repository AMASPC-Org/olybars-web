# OlyBars Deployment Safety Protocol

This rule prevents accidental deployment of broken code or misaligned environment configurations.

## 1. Pre-Deployment Mandate
- **Build Check**: `npm run build` MUST pass successfully before any manual `firebase deploy` or `gcloud deploy` command.
- **Backend Check**: `npm run build --prefix functions` must be verified for backend changes.

## 2. Environment Alignment
- **Verify Target**: Always check the current active Firebase project (`firebase projects:list`) against the desired environment (DEV vs PROD).
- **Config Sync**: Ensure `.env.local` or environment variables in the terminal align with the target project ID (e.g., `ama-ecosystem-dev-9ceda`).

## 3. Atomic Changes
- Do not combine major refactors with architectural deployments if possible. Verify refactors locally and on DEV hosting before touching Cloud Run or PROD rules.
