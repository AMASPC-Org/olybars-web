import { db } from '../firebaseAdmin.js';
import { ScraperService } from '../services/ScraperService.ts';
import { PartnerTier } from '../../../src/types/venue.ts';

async function verifyScraper() {
    console.log('🧪 Starting Scraper Verification...');

    // 1. Create Test Venue in Emulator
    const testVenue = {
        id: 'brotherhood-lounge',
        name: 'The Brotherhood Lounge',
        isActive: true,
        is_scraping_enabled: true,
        scrape_source_url: 'https://www.brotherhoodlounge.com/calendar', // Active event page
        partnerConfig: {
            tier: PartnerTier.PRO,
            billingCycleStart: Date.now(),
            flashBountiesUsed: 0
        },
        venueType: 'bar_pub',
        foodService: 'none_byof',
        tier_config: {
            is_directory_listed: true,
            is_league_eligible: true
        },
        attributes: {
            has_manned_bar: true,
            minors_allowed: false,
            noise_level: 'Lively'
        }
    };

    console.log(`Setting up test venue: ${testVenue.name}...`);
    await db.collection('venues').doc(testVenue.id).set(testVenue);

    // 2. Trigger Scrape
    try {
        await ScraperService.runScheduledScrape();
    } catch (error) {
        console.error('❌ Scrape error:', error);
    }

    // 3. Check Results
    const eventsSnapshot = await db.collection('league_events')
        .where('venueId', '==', testVenue.id)
        .get();

    console.log(`\n📊 Results for ${testVenue.name}:`);
    console.log(`Events Found: ${eventsSnapshot.size}`);

    eventsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- [${data.date}] ${data.title} (${data.type})`);
    });

    const historySnapshot = await db.collection('scrape_history')
        .where('venueId', '==', testVenue.id)
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (!historySnapshot.empty) {
        const log = historySnapshot.docs[0].data();
        console.log(`\n📜 Last Scrape Log: status=${log.status}, eventsFound=${log.eventsFound}`);
        if (log.error) console.log(`Error: ${log.error}`);
    }

    process.exit(0);
}

verifyScraper();
