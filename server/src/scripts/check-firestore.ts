
import { db } from "../firebaseAdmin.js";
import { config } from "../appConfig/config.js";

async function check() {
  console.log(`Project: ${config.GOOGLE_CLOUD_PROJECT}`);
  const snapshot = await db.collection("venues").get();
  console.log(`Venue Count: ${snapshot.size}`);
  snapshot.docs.slice(0, 3).forEach(doc => {
    const data = doc.data();
    console.log(`- ${data.name} (ID: ${doc.id})`);
    console.log(`  isActive: ${data.isActive}`);
    console.log(`  tier_config: ${JSON.stringify(data.tier_config)}`);
    console.log(`  venueType: ${data.venueType}`);
  });
  process.exit(0);
}

check();
