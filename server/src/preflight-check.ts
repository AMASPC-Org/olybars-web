import { db } from './firebaseAdmin.js';

async function checkAdminRole() {
    const adminEmail = 'ryan@amaspc.com';
    console.log(`Checking role for: ${adminEmail}`);

    try {
        const userSnapshot = await db.collection('users').where('email', '==', adminEmail).get();

        if (userSnapshot.empty) {
            console.error('❌ CRITICAL: No user found with that email.');
            return;
        }

        userSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`✅ Found User: ${doc.id}`);
            console.log(`   Role: ${data.role}`);
            console.log(`   SystemRole: ${data.systemRole}`);
            console.log(`   IsAdmin: ${data.isAdmin}`);

            if (data.role === 'super-admin' || data.isAdmin === true) {
                console.log('\n🌟 SAFE TO PROCEED: Admin role verified.');
            } else {
                console.warn('\n⚠️ WARNING: User exists but lacks Super Admin privileges. Proceeding will lock them out of admin functions.');
            }
        });
    } catch (e) {
        console.error('❌ Error checking database:', e);
    }
}

checkAdminRole();
