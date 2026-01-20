import { db } from './firebaseAdmin.js';

async function listUsers() {
    console.log('Listing existing users...');
    try {
        const usersSnapshot = await db.collection('users').limit(10).get();
        if (usersSnapshot.empty) {
            console.log('No users found in collection.');
            return;
        }
        usersSnapshot.forEach(doc => {
            console.log(`- ${doc.id}: ${doc.data().email} (Role: ${doc.data().role})`);
        });
    } catch (e) {
        console.error('Error:', e);
    }
}

listUsers();
