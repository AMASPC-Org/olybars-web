import admin from 'firebase-admin';
import { db } from '../firebaseAdmin.js';

async function seedUsers() {
    console.log('🌱 Seeding test users...');

    const users = [
        {
            uid: 'user_1',
            handle: 'OlyNightOwl',
            email: 'owl@example.com',
            phone: '555-010-0001',
            league_stats: { points: 1500, rank: 'Gold' },
            current_status: 'Checked in at The Brotherhood',
            isLeagueHQ: true
        },
        {
            uid: 'user_2',
            handle: 'RainyDayBeer',
            email: 'rain@example.com',
            league_stats: { points: 450, rank: 'Bronze' },
            current_status: 'Walking to Hannahs'
        },
        {
            uid: 'user_3',
            // No handle (should fallback to Anonymous)
            email: 'secret@example.com',
            current_status: 'In the shadows'
        }
    ];

    const batch = db.batch();
    for (const user of users) {
        const userRef = db.collection('users').doc(user.uid);
        batch.set(userRef, user);
    }

    await batch.commit();
    console.log('✅ Seeding complete.');
}

seedUsers().catch(console.error);
