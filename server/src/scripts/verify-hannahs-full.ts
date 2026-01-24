import { db } from "../firebaseAdmin";
import fs from "fs";
import path from "path";

async function run() {
  const results: string[] = [];
  results.push("--- VERIFICATION START ---");

  // Check 'hannahs' (lowercase) - The Correct One
  const ref = db.collection("venues").doc("hannahs");
  const doc = await ref.get();

  if (doc.exists) {
    const data = doc.data();
    results.push("FOUND: hannahs (lowercase)");
    results.push(`insiderVibe: ${data?.insiderVibe ? "PRESENT" : "MISSING"}`);
    results.push(`originStory: ${data?.originStory ? "PRESENT" : "MISSING"}`);
    results.push(`isAllAges: ${data?.isAllAges}`);
    results.push(`gameFeatures: ${JSON.stringify(data?.gameFeatures)}`);
    results.push(`rating: ${data?.rating}`);
    results.push(`googleRating: ${data?.googleRating}`);
    results.push(`user_ratings_total: ${data?.user_ratings_total}`);
  } else {
    results.push("NOT FOUND: hannahs (lowercase)");
  }

  results.push("--------------------------");

  // Check 'Hannahs' (Capitalized) - The Zombie?
  const refCap = db.collection("venues").doc("Hannahs");
  const docCap = await refCap.get();

  if (docCap.exists) {
    const dataCap = docCap.data();
    results.push("FOUND: Hannahs (Capitalized) - POTENTIAL ZOMBIE");
    results.push(
      `insiderVibe: ${dataCap?.insiderVibe ? "PRESENT" : "MISSING"}`,
    );
    results.push(`isAllAges: ${dataCap?.isAllAges}`);
    results.push(`gameFeatures: ${JSON.stringify(dataCap?.gameFeatures)}`);
  } else {
    results.push("NOT FOUND: Hannahs (Capitalized)");
  }

  results.push("--- VERIFICATION END ---");

  // Write to file
  const logPath = path.resolve("verification-clean.txt");
  fs.writeFileSync(logPath, results.join("\n"));
  console.log(`Wrote results to ${logPath}`);
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
