import { db } from "../firebaseAdmin";
import { syncVenueWithGoogle } from "../venueService";

async function multiSync() {
  console.log("--- STARTING GLOBAL PLACES SYNC ---");
  const snapshot = await db.collection("venues").get();

  const results: any[] = [];

  for (const doc of snapshot.docs) {
    const venueId = doc.id;
    try {
      // Force sync by passing googlePlaceId as manualPlaceId to bypass throttle
      const result = await syncVenueWithGoogle(
        venueId,
        doc.data().googlePlaceId,
      );
      if (result.success) {
        console.log(
          `[SYNCED] ${doc.data().name} -> ${result.updates?.address}`,
        );
        results.push({
          id: venueId,
          name: doc.data().name,
          address: result.updates?.address,
          location: result.updates?.location,
        });
      } else {
        console.warn(`[SKIPPED] ${doc.data().name}: ${result.message}`);
      }
    } catch (error: any) {
      console.error(`[FAILED] ${doc.data().name}: ${error.message}`);
    }
  }

  console.log("--- SYNC COMPLETE ---");
  console.log("Updated Data for seed.ts:");
  console.log(JSON.stringify(results, null, 2));
  process.exit(0);
}

multiSync();
