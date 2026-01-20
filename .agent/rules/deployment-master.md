# Deployment & Release Master

This rule serves as the "Constitution" for deployment governance. It mandates the use of specific Antigravity Workflows for all release operations.

## 1. Governance Policy
- **Manual Commands Forbidden**: Do NOT run raw `npm run deploy` commands manually.
- **Mandatory Workflows**:
    - **DEV Deployment**: MUST use `/deploy-dev` (or the `deploy-dev.md` workflow).
    - **PROD Deployment**: MUST use `/deploy-prod` (or the `deploy-prod.md` workflow).
- **Enforcement**: These workflows automatically enforce the "Drift Guardrails" and "Secret Checks" defined in `olybars-deploy-and-secrets-guardrails.md`.

## 2. Environment Strategy
- **Region/Project**: Governed by [olybars-operating-system.md](file:///c:/Users/USER1/olybars/.agent/rules/olybars-operating-system.md).
- **Isolation**: Workflows strictly isolate `ama-ecosystem-dev-9ceda` (DEV) and `ama-ecosystem-prod` (PROD).

## 3. Atomic Promotion
- **Principle**: We do not deploy "frontend only" or "functions only" to PROD without a clear reason. The `/deploy-prod` workflow promotes the entire stack to ensure version consistency.

## 4. PROD Protection
- **Approval**: PROD deployments differ from DEV in that they require explicit user confirmation (built into the agent's release protocol).
- **No Data Wipes**: Database seeding in PROD (`seed:prod`) is restricted and effectively gated by the workflow's "Drift Guardrail".

## 5. Compliance Checks
- Before any major feature release, the agent MUST consult [audit-and-compliance.md](file:///c:/Users/USER1/olybars/.agent/workflows/audit-and-compliance.md) for WSLCB and Privacy verification.
