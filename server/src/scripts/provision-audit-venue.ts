
import { db } from '../firebaseAdmin.js';

const VENUE_ID = 'audit-test-venue';

async function provision() {
    console.log(`🚀 Provisioning test venue: ${VENUE_ID}`);

    const venueRef = db.collection('venues').doc(VENUE_ID);

    const testData = {
        id: VENUE_ID,
        name: "Health Audit Test Venue",
        venueType: "bar_pub",
        status: "mellow",
        clockIns: 0,
        capacity: 100,
        isPaidLeagueMember: true,
        vibe: "A temporary venue for automated health audits.",
        isActive: true,
        isVisible: true,
        currentBuzz: {
            score: 0,
            lastUpdated: Date.now()
        },
        tier_config: {
            is_directory_listed: true,
            is_league_eligible: true
        }
        // NO location field here to bypass geofencing
    };

    await venueRef.set(testData, { merge: true });
    console.log('✅ Test venue provisioned successfully.');
    process.exit(0);
}

provision().catch(err => {
    console.error('❌ Provisioning failed:', err);
    process.exit(1);
});
