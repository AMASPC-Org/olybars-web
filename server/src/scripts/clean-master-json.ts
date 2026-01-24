import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ESM path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const jsonPath = path.resolve(__dirname, "../data/venues_master.json");

const KEYS_TO_REMOVE = [
  "isAllAges",
  "isDogFriendly",
  "hasOutdoorSeating",
  "isSoberFriendly",
  "hasPrivateRoom",
  "gameFeatures",
  "services",
  "tier_config", // Wait, tier_config might be important?
  // User only mentioned "Features & Play Tags". tier_config controls directory listing. KEEP tier_config.
];

// Re-defining for strictness based on the "No Hallucination" goal
const FEATURES_TO_WIPE = [
  "isAllAges",
  "isDogFriendly",
  "hasOutdoorSeating",
  "isSoberFriendly",
  "hasPrivateRoom",
  "gameFeatures",
  "services",
];

async function cleanMasterJson() {
  console.log(`Reading master JSON from: ${jsonPath}`);
  const raw = fs.readFileSync(jsonPath, "utf-8");
  const venues = JSON.parse(raw);

  let modifiedCount = 0;

  const cleanedVenues = venues.map((venue: any) => {
    let modified = false;
    FEATURES_TO_WIPE.forEach((key) => {
      if (venue[key] !== undefined) {
        delete venue[key];
        modified = true;
      }
    });
    if (modified) modifiedCount++;
    return venue;
  });

  if (modifiedCount > 0) {
    console.log(`Cleaning ${modifiedCount} venues in master JSON...`);
    fs.writeFileSync(jsonPath, JSON.stringify(cleanedVenues, null, 2));
    console.log("✅ venues_master.json cleaned successfully.");
  } else {
    console.log("✨ venues_master.json is already clean.");
  }
}

cleanMasterJson();
