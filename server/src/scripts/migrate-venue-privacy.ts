import { db } from '../lib/firebase.js';
import { collection, getDocs, doc, setDoc, updateDoc, deleteField, writeBatch } from 'firebase/firestore';

/**
 * MIGRATION: Venue Privacy
 * Moves `partnerConfig` and `menuItem.margin_tier` to `private_data` subcollection.
 * 
 * Usage: npx tsx server/src/scripts/migrate-venue-privacy.ts
 */

const executeMigration = async () => {
  console.log("Starting Venue Privacy Migration...");

  const venuesSnapshot = await getDocs(collection(db, 'venues'));
  const total = venuesSnapshot.size;
  console.log(`Found ${total} venues to process.`);

  let processed = 0;
  const batchSize = 100; // Firestore limit is 500, keeping it safe
  let batch = writeBatch(db);
  let opCount = 0;

  for (const venueDoc of venuesSnapshot.docs) {
    const venueId = venueDoc.id;
    const data = venueDoc.data();

    // 1. Prepare Private Data
    const privateData: any = {};
    let hasUpdates = false;

    // Move Partner Config
    if (data.partnerConfig) {
      console.log(`[${venueId}] Moving partnerConfig...`);
      privateData.config = data.partnerConfig;
      hasUpdates = true;
    }

    // Move Menu Margins
    // Note: In the new model, menuItems are in a subcollection, but if they were in `fullMenu` array on doc:
    // We need to check both sources. Based on types, `fullMenu` was on the doc.
    if (data.fullMenu && Array.isArray(data.fullMenu)) {
      console.log(`[${venueId}] Extracting margins from fullMenu...`);
      const margins: Record<string, string> = {};
      const cleanMenu = data.fullMenu.map((item: any) => {
        if (item.margin_tier) {
          margins[item.id] = item.margin_tier;
          delete item.margin_tier; // Remove from public object
        }
        return item;
      });

      if (Object.keys(margins).length > 0) {
        privateData.menuMargins = margins;
        hasUpdates = true;

        // Update the public menu (stripped of margins)
        batch.update(venueDoc.ref, { fullMenu: cleanMenu });
        opCount++;
      }
    }

    // 2. Write Private Data
    if (hasUpdates) {
      const privateConfigRef = doc(db, `venues/${venueId}/private_data/config`);
      // Use set w/ merge to respect existing private data if any
      batch.set(privateConfigRef, privateData, { merge: true });
      opCount++;

      // 3. Delete from Public Doc
      batch.update(venueDoc.ref, {
        partnerConfig: deleteField()
      });
      opCount++;
    }

    // Commit batch if full
    if (opCount >= batchSize) {
      await batch.commit();
      batch = writeBatch(db);
      opCount = 0;
      console.log(`Committed batch...`);
    }

    processed++;
  }

  // Final commit
  if (opCount > 0) {
    await batch.commit();
  }

  console.log(`Migration Complete. Processed ${processed} venues.`);
};

// Check if running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  executeMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
