import admin from 'firebase-admin';
import { db } from '../firebaseAdmin.js';

/**
 * Migration Script: Public Profile Split
 * Purpose: Iterates through users collection and populates public_profiles.
 */

interface UserProfile {
    handle?: string;
    avatarUrl?: string;
    league_stats?: { points: number; rank: string };
    current_status?: string;
    isLeagueHQ?: boolean;
}

function fuzzStatus(status: string | undefined): string {
    if (!status) return "Offline";
    return "Active on OlyBars";
}

async function migrate() {
    console.log('🚀 Starting Public Profile Migration...');

    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();

    if (snapshot.empty) {
        console.log('No users found to migrate.');
        return;
    }

    console.log(`Found ${snapshot.size} users. Syncing...`);

    const batchSize = 500;
    let batch = db.batch();
    let count = 0;
    let committed = 0;

    for (const doc of snapshot.docs) {
        const newUser = doc.data() as UserProfile;
        const userId = doc.id;

        const publicProfile = {
            handle: newUser.handle || "Anonymous",
            avatarUrl: newUser.avatarUrl || "",
            league_stats: newUser.league_stats || { points: 0, rank: "Unranked" },
            current_status: fuzzStatus(newUser.current_status),
            isLeagueHQ: newUser.isLeagueHQ || false,
            lastSyncedAt: admin.firestore.FieldValue.serverTimestamp(),
        };

        const publicRef = db.collection('public_profiles').doc(userId);
        batch.set(publicRef, publicProfile, { merge: true });
        count++;

        if (count % batchSize === 0) {
            await batch.commit();
            committed += count;
            batch = db.batch();
            console.log(`...committed ${committed} total`);
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
        committed += count;
    }

    console.log(`✅ Success! Final count: ${committed} profiles migrated.`);
}

migrate().catch(err => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
