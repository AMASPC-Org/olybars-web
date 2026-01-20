# OlyBars Deployment Runbook

## Technical Debt & Infrastructure Notes

### [DEV-ENV] Firestore Emulator Java Mismatch (Jan 2026)
*   **Issue**: The current version of `firebase-tools` requires **Java 21** for the Firestore Emulator. The local environment is currently running **Java 17**.
*   **Impact**: Firestore security rules unit tests fail to run in the local terminal without a Java upgrade.
*   **Status**: Logged. Fix scheduled for next dev-environment maintenance window. Do not block security audits for this.
*   **Workaround**: Deploy rules to the `olybars-dev` Firebase project and perform manual verification if local emulator testing is blocked.

## Standard Deployment Procedures
(Add standard procedures here as they are defined)
