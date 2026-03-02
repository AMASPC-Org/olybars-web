
import { db } from '../firebaseAdmin.js'; // Ensure .js extension for ESM if needed, or check local imports
import { config } from '../appConfig/config.js';

async function findGhost() {
  console.log("Searching for 'OLYBARS' or 'separators' in Firestore...");
  const venues = await db.collection('venues').get();
  let found = false;
  venues.docs.forEach(doc => {
    const data = doc.data();
    const name = data.name || "";
    const id = doc.id;
    if (name.toUpperCase().includes("OLYBARS") || name.toUpperCase().includes(".COM") || id.includes("olybars")) {
      console.log(`FOUND SUSPECT VENUE: ${id} => Name: ${name}`);
      found = true;
    }
  });

  if (!found) {
    console.log("No venues found with 'OLYBARS' in the name.");
  }
}

findGhost().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
