import { auth, db } from '../firebaseAdmin';
import { config } from '../appConfig/config';
import readline from 'readline';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query: string) => new Promise<string>(resolve => rl.question(query, resolve));
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function clearCollection(collectionName: string) {
    console.log(`Clearing collection: ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`✅ Cleared ${snapshot.size} documents from ${collectionName}.`);
}

async function resetUsers() {
    const isProd = config.NODE_ENV === 'production';
    const isLocal = !process.env.K_SERVICE;
    const forceProd = process.argv.includes('--force-prod');

    console.log(`\n🚀 [RESET] Environment: ${config.NODE_ENV.toUpperCase()}`);

    if (isProd) {
        if (!forceProd) {
            console.error('❌ [ERROR] You are attempting to RESET USERS in PRODUCTION without the --force-prod flag.');
            process.exit(1);
        }

        console.warn('⚠️  [WARNING] YOU ARE ABOUT TO DELETE ALL USERS AND LOGS IN THE PRODUCTION DATABASE.');
        console.warn('⚠️  [WARNING] THIS ACTION IS DESTRUCTIVE AND IRREVERSIBLE.');

        for (let i = 5; i > 0; i--) {
            console.warn(`Countdown: ${i}...`);
            await sleep(1000);
        }

        const answer = await question('Are you absolutely sure you want to proceed? (Y/N): ');
        if (answer.toLowerCase() !== 'y') {
            console.log('Reset aborted by user. 🍻');
            process.exit(0);
        }
    } else if (isLocal) {
        if (!process.env.FIRESTORE_EMULATOR_HOST) {
            console.error('❌ [ERROR] NO EMULATOR DETECTED. The "Safety Switch" in firebaseAdmin.ts should have caught this.');
            console.error('❌ [FATAL] Aborting to protect Production.');
            process.exit(1);
        }
        console.log('📡 [LOCAL] Connected to Emulator. Proceeding with safe reset.');
    }

    console.log('--- STARTING USER RESET ---');

    try {
        // 1. Delete all users from Firebase Auth
        console.log('Fetching all users from Auth...');
        const listUsersResult = await auth.listUsers(1000);
        const uids = listUsersResult.users.map((user) => user.uid);

        if (uids.length > 0) {
            console.log(`Deleting ${uids.length} users from Auth...`);
            await auth.deleteUsers(uids);
            console.log('✅ Deleted all users from Auth.');
        } else {
            console.log('No users found in Auth.');
        }

        // 2. Clear Firestore user-related collections
        await clearCollection('users');
        await clearCollection('activity_logs');
        await clearCollection('ai_access_logs');
        await clearCollection('events');
        await clearCollection('signals');

        // 3. Define the 3 Master Users
        const masterUsers = [
            {
                email: 'ryan@amaspc.com',
                password: 'Password123',
                displayName: 'Ryan Admin',
                handle: 'RyanAdmin',
                role: 'super-admin',
                systemRole: 'admin',
                stats: {
                    seasonPoints: 0,
                    lifetimeClockins: 100,
                    currentStreak: 42,
                    vibeCheckCount: 0,
                    competitionPoints: 0
                }
            },
            {
                email: 'ryan@americanmarketingalliance.com',
                password: 'Password123',
                displayName: 'Ryan Partner',
                handle: 'RyanPartner',
                role: 'owner',
                systemRole: 'guest', // They are not system admins, just venue owners
                stats: {
                    seasonPoints: 0,
                    lifetimeClockins: 0,
                    currentStreak: 0,
                    vibeCheckCount: 0,
                    competitionPoints: 0
                }
            },
            {
                email: 'ryan.r.rutledge@gmail.com',
                password: 'Password123',
                displayName: 'Ryan Player',
                handle: 'RyanPlayer',
                role: 'PLAYER',
                systemRole: 'guest',
                stats: {
                    seasonPoints: 500, // Give some starter points
                    lifetimeClockins: 5,
                    currentStreak: 3,
                    vibeCheckCount: 0,
                    competitionPoints: 0
                }
            }
        ];

        // 4. Create the users
        console.log('\n--- CREATING MASTER USERS ---');
        for (const user of masterUsers) {
            const { password, ...profileData } = user;

            console.log(`Creating user: ${user.email}...`);
            const userRecord = await auth.createUser({
                email: user.email,
                password: password,
                displayName: user.displayName,
            });

            const uid = userRecord.uid;
            await db.collection('users').doc(uid).set({
                uid,
                ...profileData,
                createdAt: Date.now(),
                updatedAt: Date.now()
            });

            console.log(`✅ Established ${user.role}: ${user.email} (UID: ${uid})`);

            // If this is the Partner Admin, link them to all venues
            if (user.email === 'ryan@americanmarketingalliance.com') {
                console.log('Linking Partner Admin to all venues...');
                const venuesSnapshot = await db.collection('venues').get();
                const venueBatch = db.batch();
                venuesSnapshot.docs.forEach((doc) => {
                    venueBatch.update(doc.ref, {
                        ownerId: uid,
                        managerIds: [uid]
                    });
                });
                await venueBatch.commit();
                console.log(`✅ Linked Partner Admin to ${venuesSnapshot.size} venues.`);
            }
        }

        console.log('\n--- RESET COMPLETE! OlyBars is now secured. 🍻 ---');
        process.exit(0);
    } catch (error) {
        console.error('❌ Reset failed:', error);
        process.exit(1);
    } finally {
        rl.close();
    }
}

resetUsers();
