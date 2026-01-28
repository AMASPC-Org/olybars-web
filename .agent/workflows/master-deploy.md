---
description: Unified Deployment Pipeline (Dev & Prod) with Guardrails
---

# Master Deploy Protocol

> **Critical**: This is the ONLY authorized way to deploy OlyBars. Direct `firebase deploy` usage is prohibited without running this guardrail first.

## 1. Context Selection
Identify the target environment:
- **DEV**: `olybars-dev-v3` (Preview, Staging)
- **PROD**: `olybars-prod` (Live Traffic)

## 2. Guardrail Execution
**Purpose**: Prevent "Drift" (Local config != Cloud config).

```bash
# For Development (Interactive)
npm run guardrail:dev

# For Production (Strict)
npm run guardrail:prod
```

> **Failure Protocol**: If the guardrail fails (exit code 1), READ the error report. Fix the missing env vars or schema mismatch. DO NOT bypass.

## 3. Deployment
Only proceed if Guardrail passes.

### Option A: Development (Fast)
```bash
npm run deploy:dev
```

### Option B: Production (Careful)
```bash
# 1. Full Build Verification
npm run build
# 2. Deploy
npm run deploy:prod
# 3. Health Check
curl https://olybars.com/api/health
```

## 4. Post-Flight Verification
- Check the **Release Channel** (Discord/Slack).
- Run `npm run smoke:prod` if available.
