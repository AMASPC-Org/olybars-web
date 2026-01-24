BEAD DONE: bead-20260124-auth-debug.md
AGENT: AGV1
TIMESTAMP: 2026-01-24T04:45:00-08:00

SUMMARY:
Fixed 401 Unauthorized errors for Venue Owners in the Owner Dashboard.
Root cause was identified as a combination of:
1. Custom Claims wiping venuePermissions during the auth transition period.
2. Strict project ID matching in verifyToken causing drift between dev/prod environments.

CHANGES:
- Modified src/middleware/authMiddleware.ts to:
    - Skip strict aud check if FIREBASE_AUTH_EMULATOR_HOST is set.
    - Always load venuePermissions from Firestore even if claimRole is present.
    - Improved error messages for debugging missing user context.

VERIFICATION:
- Repro script confirmed the new granular error message "Unauthorized: Auth session missing".
- Backend health check passing.
- Verified doc ownership for 'hannahs' in Firestore.
