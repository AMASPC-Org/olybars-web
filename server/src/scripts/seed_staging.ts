import { db } from '../firebaseAdmin.js';
import { config } from '../appConfig/config.js';

// The Test Tavern (Staging Only)
const testVenue = {
    id: 'test-tavern',
    name: 'The Test Tavern',
    description: 'A dedicated staging ground for Artie and Schmidt testing. "Where the bugs go to die."',
    address: '123 Test St, Olympia, WA 98501',
    googlePlaceId: 'ChIJVTPokywVkFQRMt7K4J6iJ-g', // Using a generic Olympia ID or mock
    location: {
        latitude: 47.0379,
        longitude: -122.9007
    },
    status: 'active',
    // League Partner Config
    pointBank: 5000,
    pointBankLastReset: Date.now(),
    tier: 'tier_2_diy',
    // Operational Defaults
    hours: {
        monday: { open: '16:00', close: '02:00' },
        tuesday: { open: '16:00', close: '02:00' },
        wednesday: { open: '16:00', close: '02:00' },
        thursday: { open: '16:00', close: '02:00' },
        friday: { open: '16:00', close: '02:00' },
        saturday: { open: '16:00', close: '02:00' },
        sunday: { open: '16:00', close: '02:00' }
    },
    features: ['pool_table', 'darts', 'patio'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
};

async function seedStaging() {
    console.log(`\n🚀 [STAGING SEED] Target Project: ${config.GOOGLE_CLOUD_PROJECT}`);

    // Safety Check: Ensure we aren't in Prod
    if (config.GOOGLE_CLOUD_PROJECT === 'ama-ecosystem-prod') {
        console.error('❌ [CRITICAL] This script is forbidden in Production.');
        process.exit(1);
    }

    try {
        console.log(`Creating Venue: ${testVenue.name}...`);
        await db.collection('venues').doc(testVenue.id).set(testVenue, { merge: true });
        console.log('✅ Venue Created.');

        console.log('✨ Staging Seed Complete.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Seeding Failed:', error);
        process.exit(1);
    }
}

seedStaging();
