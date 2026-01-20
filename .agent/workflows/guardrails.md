---
description: How to verify environment consistency and troubleshoot guardrail failures.
---
# Guardrails Workflow

## Usage
*   **Local Validity**: `npm run guardrail:local`
*   **Dev Cloud Validity**: `npm run guardrail:dev`
*   **Prod Cloud Validity**: `npm run guardrail:prod`

## Failures
If a guardrail fails:
1.  **Local**: Check `.env` against `server/src/appConfig/schema.ts`. Copy missing keys from `.env.example` or ask a team member.
2.  **Cloud**: The error lists missing keys. Go to Google Cloud Console -> Cloud Run -> Edit & Deploy New Revision -> Variables, and add the missing secrets.

## Bypassing
Set `SKIP_GUARDRAIL=true` to skip checks.
