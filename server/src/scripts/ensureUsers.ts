
import { auth, db } from '../firebaseAdmin';
import { config } from '../appConfig/config';

const USERS = [
    {
        uid: 'super-admin-ryan',
        email: 'ryan@amaspc.com',
        password: 'Password123',
        displayName: 'Ryan (Super Admin)',
        role: 'super-admin',
        homeBase: null,
        venuePermissions: {}
    },
    {
        uid: 'partner-ryan',
        email: 'ryan@americanmarketingalliance.com',
        password: 'Password123',
        displayName: 'Ryan (Venue Owner Experience)',
        role: 'owner',
        homeBase: null,
        venuePermissions: {}
    },
    {
        uid: 'player-ryan',
        email: 'ryan.r.rutledge@gmail.com',
        password: 'Password123',
        displayName: 'Ryan (Player)',
        role: 'user',
        homeBase: null,
        venuePermissions: {}
    }
];

async function ensureUsers() {
    console.log('Starting user reset/ensure process...');

    for (const data of USERS) {
        // Clone data so we can modify uid if needed
        const user = { ...data };

        try {
            let userRecord;
            let foundBy = 'none';

            // 1. Check if user exists (by UID first)
            try {
                userRecord = await auth.getUser(user.uid);
                foundBy = 'uid';
            } catch (e: any) {
                if (e.code === 'auth/user-not-found') {
                    // 1b. Check by email
                    try {
                        userRecord = await auth.getUserByEmail(user.email);
                        foundBy = 'email';
                        // IMPORTANT: Update our local UID to match the existing one
                        user.uid = userRecord.uid;
                        console.log(`User ${user.email} found by EMAIL(UID: ${user.uid}).Using existing UID.`);
                    } catch (e2: any) {
                        if (e2.code !== 'auth/user-not-found') throw e2;
                    }
                } else {
                    throw e;
                }
            }

            if (userRecord) {
                console.log(`User ${user.email} existing(UID: ${user.uid}).Updating...`);
                await auth.updateUser(user.uid, {
                    email: user.email,
                    password: user.password,
                    displayName: user.displayName,
                    emailVerified: true
                });
            } else {
                console.log(`User ${user.email} not found.Creating...`);
                userRecord = await auth.createUser({
                    uid: user.uid,
                    email: user.email,
                    password: user.password,
                    displayName: user.displayName,
                    emailVerified: true
                });
            }

            // 2. Set Custom Claims
            const claims = {
                role: user.role,
                ...(user.homeBase ? { venueId: user.homeBase } : {})
            };
            await auth.setCustomUserClaims(user.uid, claims);
            console.log(`Claims set for ${user.email}: `, claims);

            // 3. Create/Update Firestore Profile
            await db.collection('users').doc(user.uid).set({
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                role: user.role,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                ...(user.homeBase ? { homeBase: user.homeBase } : {}),
                ...(user.venuePermissions ? { venuePermissions: user.venuePermissions } : {}),
                ...(user.role === 'super-admin' ? { systemRole: 'admin' } : {})
            }, { merge: true });

            console.log(`Firestore profile updated for ${user.email}`);

        } catch (error) {
            console.error(`Error processing user ${user.email}: `, error);
        }
    }

    console.log('User ensure process complete.');
    process.exit(0);
}

ensureUsers();
