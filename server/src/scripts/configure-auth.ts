import { auth, db } from '../firebaseAdmin.js';
import { UserRole } from '../../src/types/user.js';
import { SystemRole, VenueRole } from '../../src/types/auth_schema.js';

/**
 * Configuration for Key Personas & Venues
 */
const TARGET_VENUES = [
  {
    id: 'hannahs-bar-grille',
    name: "Hannah's Bar & Grille",
    location: { lat: 47.0379, lng: -122.9007 }, // Approximation for Olympia
    address: "123 Main St, Olympia, WA"
  }
];

const TARGET_USERS = [
  {
    email: 'ryan@amaspc.com',
    role: 'super-admin' as UserRole,
    systemRole: 'admin' as SystemRole,
    isAdmin: true,
    displayName: 'Ryan (Super Admin)',
    venuePermissions: {}
  },
  {
    email: 'ryan@americanmarketingalliance.com',
    role: 'owner' as UserRole,
    systemRole: 'guest' as SystemRole,
    isAdmin: false,
    displayName: 'Ryan (Hannah\'s Owner)',
    venuePermissions: { 'hannahs-bar-grille': 'owner' } as Record<string, VenueRole>
  },
  {
    email: 'ryan.r.rutledge@gmail.com',
    role: 'user' as UserRole,
    systemRole: 'guest' as SystemRole,
    isAdmin: false,
    displayName: 'Ryan (Player)',
    venuePermissions: {}
  }
];

const COMMON_PASSWORD = 'Password123';

async function configureAuth() {
  console.log('\n🔐 [AUTH CONFIG v2] Starting Security & Identity Configuration...\n');

  try {
    // ==========================================
    // STEP 0: SEED MISSING VENUES
    // ==========================================
    console.log('🏛️ [STEP 0] Ensuring Target Venues Exist...');

    for (const venue of TARGET_VENUES) {
      const venueRef = db.collection('venues').doc(venue.id);
      const doc = await venueRef.get();

      if (!doc.exists) {
        console.log(`    ⚠️  Creating Missing Venue: ${venue.name} (${venue.id})`);
        await venueRef.set({
          id: venue.id,
          name: venue.name,
          location: venue.location,
          address: venue.address,
          active: true,
          description: "Automatically seeded for Auth Testing",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      } else {
        console.log(`    ✅ Venue Exists: ${venue.name}`);
      }
    }

    // ==========================================
    // STEP 1: ADMIN HYGIENE SCRUB (Single Admin Policy)
    // ==========================================
    console.log('\n🧹 [STEP 1] Scrubbing Unauthorized Admins...');

    const superAdminQuery = await db.collection('users')
      .where('role', 'in', ['admin', 'super-admin'])
      .get();

    let downgradedCount = 0;

    superAdminQuery.docs.forEach(async (doc) => {
      const userData = doc.data();
      const email = userData.email?.toLowerCase();
      const uid = doc.id;

      // Allow list: only ryan@amaspc.com
      if (email === 'ryan@amaspc.com') return;

      console.warn(`    ⚠️  DOWNGRADING Unauthorized Admin: ${email} (${uid})`);

      // 1. Downgrade Auth Claims
      await auth.setCustomUserClaims(uid, {
        role: 'user',
        systemRole: 'guest',
        isAdmin: false
      });

      // 2. Downgrade Firestore
      await db.collection('users').doc(uid).set({
        role: 'user',
        systemRole: 'guest',
        isAdmin: false,
        updatedAt: Date.now()
      }, { merge: true });

      downgradedCount++;
    });

    if (downgradedCount === 0) {
      console.log('    ✅ Clean! No unauthorized admins found.');
    } else {
      console.log(`    ✅ Scrubbed ${downgradedCount} unauthorized admins.`);
    }


    // ==========================================
    // STEP 2: UPSERT TARGET PERSONAS
    // ==========================================
    console.log('\n👥 [STEP 2] Upserting Key Personas...');

    for (const target of TARGET_USERS) {
      console.log(`    Processing: ${target.email} [${target.role}]`);

      let uid: string;
      let userRecord;

      // 1. Get or Create Auth User
      try {
        userRecord = await auth.getUserByEmail(target.email);
        uid = userRecord.uid;

        // Update Password & Verify Email
        await auth.updateUser(uid, {
          password: COMMON_PASSWORD,
          emailVerified: true,
          displayName: target.displayName
        });
        console.log(`       -> Auth: Updated existing user.`);

      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Create New
          userRecord = await auth.createUser({
            email: target.email,
            password: COMMON_PASSWORD,
            emailVerified: true,
            displayName: target.displayName
          });
          uid = userRecord.uid;
          console.log(`       -> Auth: Created NEW user.`);
        } else {
          throw error;
        }
      }

      // 2. Set Custom Claims (Protocol)
      await auth.setCustomUserClaims(uid, {
        role: target.role,
        systemRole: target.systemRole,
        isAdmin: target.isAdmin,
        venuePermissions: target.venuePermissions
      });
      console.log(`       -> Claims: Set { role: ${target.role}, isAdmin: ${target.isAdmin} }`);

      // 3. Update Firestore (App State)
      await db.collection('users').doc(uid).set({
        uid: uid,
        email: target.email,
        displayName: target.displayName,
        role: target.role,
        systemRole: target.systemRole,
        isAdmin: target.isAdmin,
        venuePermissions: target.venuePermissions,
        emailVerified: true,
        updatedAt: Date.now()
      }, { merge: true });
      console.log(`       -> Firestore: Document Synced.`);
    }

    console.log('\n✨ [SUCCESS] Auth Configuration Complete.');
    console.log(`    -> All users set to password: '${COMMON_PASSWORD}'`);
    console.log(`    -> Admin Hygiene Enforced.`);
    console.log(`    -> "Hannah's Bar & Grille" ownership assigned.`);
    process.exit(0);

  } catch (error) {
    console.error('\n❌ [ERROR] Auth Configuration Failed:', error);
    process.exit(1);
  }
}

configureAuth();
