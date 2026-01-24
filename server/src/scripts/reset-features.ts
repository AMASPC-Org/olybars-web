import { db } from "../firebaseAdmin.js";

async function resetFeatures() {
  console.log("--- STARTING CLEAN SLATE RESET ---");
  console.log("Setting all features and play fields to FALSE/Empty...");

  const snapshot = await db.collection("venues").get();

  let batch = db.batch();
  let count = 0;

  for (const doc of snapshot.docs) {
    const venueRef = db.collection("venues").doc(doc.id);

    // Explicitly set all known feature/play flags to false
    // This ensures no hallucinations from AI or legacy data
    batch.update(venueRef, {
      isAllAges: false,
      isDogFriendly: false,
      hasOutdoorSeating: false,
      isSoberFriendly: false,
      hasPrivateRoom: false,
      gameFeatures: [],
      // Clear Services as well if we are re-syncing them
      services: [],
    });

    count++;

    // Commit batches of 500
    if (count % 400 === 0) {
      await batch.commit();
      console.log(`Reset ${count} venues...`);
      batch = db.batch();
    }
  }

  if (count > 0) {
    await batch.commit();
  }

  console.log(`--- COMPLETE: Reset ${count} venues to clean slate. ---`);
  process.exit(0);
}

resetFeatures();
