import * as admin from 'firebase-admin';
import { Venue, ScraperSource } from '../../src/types/venue';

// Initialize Firebase Admin if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Migration Script: Scraper Target Categorization
 * 
 * Logic:
 * 1. Scan all venues with `scraper_config`.
 * 2. For any source with target "WEBSITE":
 *    - Check the URL for keywords like "menu", "drinks", "taplist", "cocktails", "calendar".
 *    - Propose/Perform a target update to "MENU", "DRINKS", or "CALENDAR".
 * 3. This ensures existing users automatically move to the new specialized AI logic.
 */

async function migrate() {
  console.log('🚀 Starting Scraper Configuration Migration...');

  const venuesSnap = await db.collection('venues').get();
  let updatedCount = 0;

  for (const doc of venuesSnap.docs) {
    const venue = doc.data() as Venue;
    if (!venue.scraper_config || venue.scraper_config.length === 0) continue;

    let hasChanges = false;
    const newConfig: ScraperSource[] = venue.scraper_config.map(source => {
      if (source.target === 'WEBSITE') {
        const url = source.url.toLowerCase();
        let newTarget: any = 'WEBSITE';

        if (url.includes('menu') && !url.includes('drink')) {
          newTarget = 'MENU';
        } else if (url.includes('drink') || url.includes('tap') || url.includes('cocktail') || url.includes('beer') || url.includes('cider')) {
          newTarget = 'DRINKS';
        } else if (url.includes('calendar') || url.includes('event')) {
          newTarget = 'CALENDAR';
        }

        if (newTarget !== 'WEBSITE') {
          console.log(`[Migrate] Venue ${venue.name}: Updating ${source.url} -> ${newTarget}`);
          hasChanges = true;
          return { ...source, target: newTarget };
        }
      }
      return source;
    });

    if (hasChanges) {
      await doc.ref.update({ scraper_config: newConfig });
      updatedCount++;
    }
  }

  console.log(`✅ Migration complete. Updated ${updatedCount} venues.`);
}

migrate().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
