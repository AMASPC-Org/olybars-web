---
description: Automated verification of the Vibe propagation system without a browser.
---

# /vibe-data-integrity

Checks the alignment between local JSON definitions, Firestore records, and backend logic.

## 1. Static Alignment Check
1. **Source of Truth**: Run `npx tsc --noEmit` on the root and `functions` directory.
2. **Coordinate Audit**: Run `npx tsx server/src/scripts/align-venue-locations.ts` to ensure all venues have official Google Place IDs and Lat/Lng.
3. **Iron Seed Verify**: Cross-reference `server/src/data/venues_master.json` with Firestore collection counts.

## 2. Headless Logic Propagation
// turbo
1. **Provision Test Venue**:
   - Run `npx tsx server/src/scripts/provision-audit-venue.ts`.
   - This creates `venues/audit-test-venue` with 0 Buzz.

2. **Simulate Buzz Injection**:
   - Manually inject a buzz score to test the "Propagator" logic.
   - ```powershell
     npx tsx -e "import { db } from './server/src/firebaseAdmin.js'; await db.collection('venues').doc('audit-test-venue').update({ 'currentBuzz.score': 15, 'currentBuzz.lastUpdated': Date.now(), 'status': 'chill' })"
     ```

3. **Verify State Transition**:
   - Fetch the document and verify the logic.
   - ```powershell
     npx tsx -e "import { db } from './server/src/firebaseAdmin.js'; const snap = await db.collection('venues').doc('audit-test-venue').get(); console.log(JSON.stringify(snap.data(), null, 2))"
     ```
   - **Success Criteria**: `status` MUST be "chill" and `currentBuzz.score` MUST be 15.

## 3. Rewards Engine Verification (Optional)
// turbo
1. If a test user UID is available, verify that a manual credit of "Drops" propagates to their profile.
   - ```powershell
     npx tsx -e "import { db } from './server/src/firebaseAdmin.js'; await db.collection('users').doc('AUDIT_USER').update({ drops: 100 })"
     ```

## 4. Teardown
// turbo
1. Run `npx tsx server/src/scripts/cleanup_venues.ts` or manually delete the test document.
   - ```powershell
     npx tsx -e "import { db } from './server/src/firebaseAdmin.js'; await db.collection('venues').doc('audit-test-venue').delete()"
     ```
