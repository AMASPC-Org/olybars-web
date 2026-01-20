import { db, auth } from '../firebaseAdmin.js';

async function syncAllCustomClaims() {
    console.log('🚀 Starting Bulk Custom Claims Sync...');

    try {
        const usersSnapshot = await db.collection('users').get();
        const totalUsers = usersSnapshot.size;
        console.log(`📋 Found ${totalUsers} users to process.`);

        const BATCH_SIZE = 50;
        let processedCount = 0;
        let successCount = 0;
        let failCount = 0;

        const users = usersSnapshot.docs;

        for (let i = 0; i < users.length; i += BATCH_SIZE) {
            const batch = users.slice(i, i + BATCH_SIZE);

            await Promise.all(batch.map(async (doc) => {
                const userData = doc.data();
                const uid = doc.id;

                try {
                    await auth.setCustomUserClaims(uid, {
                        role: userData.role || 'user',
                        isAdmin: !!userData.isAdmin
                    });
                    successCount++;
                } catch (error) {
                    console.error(`❌ Failed to sync claims for ${uid} (${userData.email}):`, error);
                    failCount++;
                }
                processedCount++;
            }));

            console.log(`⏳ Progress: ${processedCount}/${totalUsers}...`);
        }

        console.log('\n✅ Sync Complete!');
        console.log(`📊 Results: ${successCount} Success, ${failCount} Failed.`);

        // --- VERIFICATION ---
        console.log('\n🧪 Running Post-Sync Verification (Sampling 5 users)...');
        const sampleSize = Math.min(5, totalUsers);
        const shuffled = users.sort(() => 0.5 - Math.random());
        const samples = shuffled.slice(0, sampleSize);

        for (const sample of samples) {
            const user = await auth.getUser(sample.id);
            console.log(`- User: ${sample.data().email} | Custom Claims:`, JSON.stringify(user.customClaims));
        }

    } catch (e) {
        console.error('💥 Fatal error during sync:', e);
    }
}

syncAllCustomClaims();
