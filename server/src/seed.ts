import { db } from './firebaseAdmin.js';
import { config } from './appConfig/config.js';
import readline from 'readline';
import venues from './data/venues_master.json' with { type: 'json' };
import knowledge from './data/knowledgeBase.json' with { type: 'json' };
import { VenueSchema } from './utils/validation.js';
export { venues, knowledge };

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string) => new Promise<string>(resolve => rl.question(query, resolve));
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function seedVenues() {
    const forceProd = process.argv.includes('--force-prod');
    const isProd = config.NODE_ENV === 'production' || forceProd;
    const isLocal = !process.env.K_SERVICE;

    console.log(`\n🚀 [IRON SEED] Environment: ${config.NODE_ENV.toUpperCase()}`);

    if (isProd) {
        if (!forceProd) {
            console.error('❌ [ERROR] You are attempting to run seeding in PRODUCTION without the --force-prod flag.');
            process.exit(1);
        }

        console.warn('⚠️  [WARNING] YOU ARE ABOUT TO UPDATE VENUE DEFINITIONS IN PRODUCTION.');
        console.warn('⚠️  [WARNING] This will overwrite static fields but PRESERVE runtime data (clock-ins, vibe).');

        if (!process.argv.includes('--yes')) {
            const answer = await question('Are you absolutely sure you want to proceed? (Y/N): ');
            if (answer.toLowerCase() !== 'y') {
                console.log('Seeding aborted by user. 🍻');
                process.exit(0);
            }
        } else {
            console.log('⚠️  [WARNING] Bypassing confirmation via --yes flag.');
        }
    } else if (isLocal) {
        if (!process.env.FIRESTORE_EMULATOR_HOST) {
            // Allow cloud seeding for non-production environments (e.g. dev syncing)
            if (process.env.NODE_ENV !== 'production' && process.argv.includes('--cloud')) {
                console.log(`📡 [CLOUD] TARGETING REMOTE PROJECT: ${config.GOOGLE_CLOUD_PROJECT}`);
            } else {
                console.error('❌ [ERROR] NO EMULATOR DETECTED. Use --cloud to target remote DB or start emulator.');
                process.exit(1);
            }
        } else {
            console.log('📡 [LOCAL] Connected to Emulator. Proceeding with idempotent seed.');
        }
    }

    console.log('Starting "The Iron Seed" (Idempotent + Validated)...');

    try {
        const venuesRef = db.collection('venues');
        let successCount = 0;
        let failCount = 0;

        for (const venueData of (venues as any[])) {
            // 1. Zod Validation
            const validation = VenueSchema.safeParse(venueData);
            if (!validation.success) {
                console.error(`❌ Validation Failed for ${venueData.name} (${venueData.id}):`);
                console.error(JSON.stringify(validation.error.format(), null, 2));
                console.error("Skipping venue due to validation errors.");
                failCount++;
                continue;
            }

            const validVenue = validation.data;
            const { id } = validVenue;

            // Ensure point bank is initialized
            if (validVenue.pointBank === undefined) {
                validVenue.pointBank = 0;
                validVenue.pointBankLastReset = Date.now();
            }

            // 2. Fetch existing doc to decide on merge strategy
            const docRef = venuesRef.doc(id);
            const doc = await docRef.get();

            if (doc.exists) {
                // UPDATE: Exclude runtime fields to prevent resetting them
                const {
                    clockIns,
                    currentBuzz,
                    status,
                    manualStatus, // If defined in master, we might want to respect it? Usually master doesn't have manualStatus.
                    ...staticData
                } = validVenue as any;

                // Also ensure we don't accidentally unset fields that are not in Schema but in DB?
                // merge: true handles that.

                // If ID is in staticData (it is), that's fine.

                await docRef.set(staticData, { merge: true });
                console.log(`🔄 Updated: ${validVenue.name}`);
            } else {
                // CREATE: Use full data (defaults included)
                await docRef.set(validVenue);
                console.log(`✨ Created: ${validVenue.name}`);
            }
            successCount++;
        }

        console.log('--- Seeding Knowledge Base ---');
        const knowledgeRef = db.collection('knowledge');
        let kSuccessCount = 0;

        for (const faqItem of (knowledge.faq as any[])) {
            const id = faqItem.question.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 50);
            await knowledgeRef.doc(id).set({
                ...faqItem,
                type: 'faq',
                updatedAt: Date.now()
            }, { merge: true });
            console.log(`🧠 Added FAQ: ${faqItem.question}`);
            kSuccessCount++;
        }

        console.log(`\nIron Seed Complete! 🍺`);
        console.log(`Venues: ${successCount} | Knowledge: ${kSuccessCount} | Failed: ${failCount}`);

        if (failCount > 0) process.exit(1);
        process.exit(0);
    } catch (error) {
        console.error('Error seeding venues:', error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

seedVenues();
