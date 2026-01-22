
import { db } from '../firebaseAdmin.js';

async function inspectVenues() {
  console.log('--- Inspecting Venues in Firestore ---');
  const snapshot = await db.collection('venues').get();

  let packedCount = 0;
  let mellowCount = 0;
  let otherCount = 0;

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.status === 'packed') {
      console.log(`[PACKED] ${data.name}`);
      packedCount++;
    } else if (data.status === 'mellow') {
      mellowCount++;
    } else {
      console.log(`[${data.status}] ${data.name}`);
      otherCount++;
    }
  });

  console.log('--- Summary ---');
  console.log(`Packed: ${packedCount}`);
  console.log(`Mellow: ${mellowCount}`);
  console.log(`Other: ${otherCount}`);
}

inspectVenues().catch(console.error);
