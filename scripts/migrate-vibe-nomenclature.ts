import { db } from '../server/src/firebaseAdmin';
import { CollectionReference } from 'firebase-admin/firestore';

const VIBE_MAP: Record<string, string> = {
  'mellow': 'trickle',
  'chill': 'flowing',
  'buzzing': 'gushing',
  'packed': 'flooded',
  'dead': 'trickle' // Mapping dead to trickle as fallback
};

async function migrateVibeNomenclature() {
  console.log('🌊 Starting Vibe Nomenclature Migration (Water Metaphor)...');

  const venuesRef = db.collection('venues');
  const snapshot = await venuesRef.get();

  if (snapshot.empty) {
    console.log('No venues found.');
    return;
  }

  let updatedCount = 0;
  const batch = db.batch();

  snapshot.docs.forEach((doc) => {
    const venue = doc.data();
    const currentStatus = venue.status;
    const newStatus = VIBE_MAP[currentStatus];

    if (newStatus && newStatus !== currentStatus) {
      console.log(`Mapping ${venue.name}: ${currentStatus} -> ${newStatus}`);
      batch.update(doc.ref, { status: newStatus });
      updatedCount++;
    }
  });

  if (updatedCount > 0) {
    await batch.commit();
    console.log(`✅ Successfully migrated ${updatedCount} venues to Water Metaphor.`);
  } else {
    console.log('✅ All venues already verified on Water Metaphor.');
  }
}

migrateVibeNomenclature().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
