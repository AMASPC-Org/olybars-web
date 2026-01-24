import { db } from "../server/src/firebaseAdmin.js";
import { venues } from "../server/src/seed.js";

async function seedDevUser() {
  const uid = process.argv[2] || "2Saqd6t2UDR0WwN9Nf9Y6Xf1X1X1"; // Default or from arg
  const email = "ryan@amaspc.com"; // Default dev email

  console.log(`🚀 [DEV SEED] Seeding user ${uid} (${email})...`);

  try {
    // 1. Create User Doc
    const userRef = db.collection("users").doc(uid);
    await userRef.set(
      {
        uid,
        email,
        role: "super-admin",
        systemRole: "admin",
        isAdmin: true,
        venuePermissions: {
          hannahs: "owner",
        },
        updatedAt: new Date().toISOString(),
      },
      { merge: true },
    );

    console.log(`✅ User profile created/updated.`);

    // 2. Assign Ownership of Hannah's
    const hannahsRef = db.collection("venues").doc("hannahs");
    await hannahsRef.set(
      {
        ownerId: uid,
        managerIds: [uid],
      },
      { merge: true },
    );

    console.log(`✅ Ownership of Hannah's Bar & Grill assigned to ${uid}.`);

    console.log(
      `\n🎉 [SUCCESS] You are now a Super-Admin with ownership of Hannah's in the LOCAL emulator.`,
    );
    console.log(
      `👉 Please RE-LOGIN in your browser to refresh your token claims.`,
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ [ERROR] Seed failed:", error);
    process.exit(1);
  }
}

seedDevUser();
