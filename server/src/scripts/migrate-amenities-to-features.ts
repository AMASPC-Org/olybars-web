import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_PATH = path.join(__dirname, "../data/venues_master.json");

interface OldPrivateSpace {
  name: string;
  amenities?: string[];
  features?: any[];
  [key: string]: any;
}

interface OldVenue {
  id: string;
  name: string;
  amenities?: string[];
  services?: string[];
  privateSpaces?: OldPrivateSpace[];
  [key: string]: any;
}

const runMigration = async () => {
  console.log(`[MIGRATION] Reading from ${DATA_PATH}`);
  const rawData = fs.readFileSync(DATA_PATH, "utf-8");
  const venues: OldVenue[] = JSON.parse(rawData);
  let changedCount = 0;

  const updatedVenues = venues.map((venue) => {
    let hasChanges = false;

    // 1. Handle Root Level Amenities -> Services
    if (venue.amenities && venue.amenities.length > 0) {
      console.log(
        `[VENUE] ${venue.name} has root amenities: ${venue.amenities.join(", ")}`,
      );
      // Move to services if not already there
      const services = new Set(venue.services || []);
      venue.amenities.forEach((a) => services.add(a));
      venue.services = Array.from(services);
      delete venue.amenities;
      hasChanges = true;
    } else if (venue.amenities) {
      delete venue.amenities; // Remove empty array
      hasChanges = true;
    }

    // 2. Handle Private Spaces Amenities -> Features
    if (venue.privateSpaces) {
      venue.privateSpaces = venue.privateSpaces.map((space) => {
        if (space.amenities) {
          // console.log(`  [SPACE] ${space.name} migrating amenities: ${space.amenities.join(', ')}`);
          const features = space.features || [];

          space.amenities.forEach((amenityName) => {
            // Check if already exists in features to avoid dupes
            if (!features.some((f: any) => f.name === amenityName)) {
              features.push({
                name: amenityName,
                count: 1,
                description: "Migrated from legacy amenities",
              });
            }
          });

          space.features = features;
          delete space.amenities;
          hasChanges = true;
          return space;
        }
        return space;
      });
    }

    if (hasChanges) changedCount++;
    return venue;
  });

  if (changedCount > 0) {
    console.log(
      `[MIGRATION] Writing ${changedCount} updated venues to disk...`,
    );
    fs.writeFileSync(DATA_PATH, JSON.stringify(updatedVenues, null, 2));
    console.log(`[MIGRATION] Success!`);
  } else {
    console.log(`[MIGRATION] No changes needed.`);
  }
};

runMigration().catch(console.error);
