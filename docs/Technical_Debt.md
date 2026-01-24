# Technical Debt Log

## Governance Violations

- **[2026-01-23] tsconfig.json is "strict": false**
  - **Context**: Zero-Drift Deployment to PROD.
  - **Decision**: Deferred enabling strict mode to prevent build failures during critical release.
  - **Remediation**: Enable strict mode and fix subsequent type errors in a future sprint.
