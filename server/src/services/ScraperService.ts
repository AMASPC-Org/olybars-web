import { db } from '../firebaseAdmin.js';
import { Venue, PartnerTier, LeagueEvent } from '../../../src/types/venue.js';
import puppeteer from 'puppeteer';
import pLimit from 'p-limit';
import { createHash, randomUUID } from 'crypto';
import { GeminiService } from './geminiService.js';

/**
 * League Night Event Scraper Service
 * Responsible for background ingestion of events for premium partners.
 */
export class ScraperService {
    private static BATCH_SIZE = 3;
    private static SCRAPE_TIMEOUT = 60000; // 60s per URL

    /**
     * Main task entry point: Fetches and processes all eligible venues.
     */
    static async runScheduledScrape() {
        console.log('[Scraper] Starting scheduled scrape job...');
        const venues = await this.getEligibleVenues();
        console.log(`[Scraper] Found ${venues.length} eligible venues.`);

        const limit = pLimit(this.BATCH_SIZE);
        const tasks = venues.map(venue => limit(() => this.processVenue(venue)));

        await Promise.allSettled(tasks);
        console.log('[Scraper] Scheduled scrape job completed.');
    }

    /**
     * Get all active venues with PRO or AGENCY status, scraper enabled, and active status.
     */
    private static async getEligibleVenues(): Promise<Venue[]> {
        const snapshot = await db.collection('venues')
            .where('partnerConfig.tier', 'in', [PartnerTier.PRO, PartnerTier.AGENCY])
            .where('is_scraping_enabled', '==', true)
            .where('isActive', '==', true)
            .get();

        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Venue));
    }

    /**
     * Orchestrates the multi-source flow for a single venue.
     */
    private static async processVenue(venue: Venue) {
        // [ADAPTER] Legacy to Multi-Source Migration
        // If scraper_config is empty/undefined but scrape_source_url exists, treat it as a migrated event source.
        const configs = (venue.scraper_config && venue.scraper_config.length > 0)
            ? venue.scraper_config
            : (venue.scrape_source_url ? [{
                id: 'legacy-migrated',
                url: venue.scrape_source_url,
                target: 'EVENTS',
                isEnabled: true,
                status: 'active'
            }] as any[] : []);

        if (configs.length === 0) {
            console.log(`[Scraper] No active sources for ${venue.name}. Skipping.`);
            return;
        }

        console.log(`[Scraper] Processing venue: ${venue.name} with ${configs.length} sources.`);

        let browser;
        try {
            // Launch Browser ONCE per venue to save overhead
            browser = await puppeteer.launch({
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
            });
            const page = await browser.newPage();
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // [SEQUENTIAL PROCESSING] Loop through sources one by one
            for (const source of configs) {
                if (!source.isEnabled) continue;
                // [BACKOFF] Skip if too many failures
                if ((source.consecutiveFailures || 0) > 3) {
                    console.warn(`[Scraper] Skipping dead source ${source.url} (Failures: ${source.consecutiveFailures})`);
                    continue;
                }

                // [FREQUENCY CHECK] Menu/Static pages don't need daily scrapes
                if (source.target === 'MENU' && source.lastScraped) {
                    const daysSince = (Date.now() - source.lastScraped) / (1000 * 60 * 60 * 24);
                    if (daysSince < 7) {
                        console.log(`[Scraper] Skipping MENU for ${venue.name} (Recent scrape).`);
                        continue;
                    }
                }

                try {
                    // [JITTER] Avoid bot detection
                    await new Promise(r => setTimeout(r, 1000 + Math.random() * 4000));

                    console.log(`[Scraper] Fetching ${source.target} from ${source.url}...`);

                    const response = await page.goto(source.url, {
                        waitUntil: 'networkidle2',
                        timeout: this.SCRAPE_TIMEOUT
                    });

                    // [BINARY PROTECTION]
                    const contentType = response?.headers()['content-type'];
                    if (contentType && contentType.includes('application/pdf')) {
                        throw new Error('PDF content not supported yet');
                    }

                    if (!response || !response.ok()) {
                        throw new Error(`HTTP Error ${response?.status}`);
                    }

                    const rawContent = await page.evaluate(() => document.body.innerText);

                    // [COST SAVER] Calculate Hash (TODO: Store hash and compare)
                    // const currentHash = createHash('md5').update(rawContent).digest('hex');

                    // [AI ANALYSIS]
                    const gemini = new GeminiService();
                    const currentTime = new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" });

                    // Multi-City Extraction
                    let city = "Olympia, WA";
                    if (venue?.address) {
                        try {
                            const parts = venue.address.split(',');
                            if (parts.length >= 3) {
                                const cityPart = parts[1].trim();
                                const stateZipPart = parts[2].trim().split(' ')[0];
                                city = `${cityPart}, ${stateZipPart}`;
                            }
                        } catch (e) {
                            console.warn(`[Scraper] Failed to parse city from address: ${venue.address}, defaulting to Olympia.`);
                        }
                    }

                    const venueContext = {
                        city,
                        timezone: "America/Los_Angeles"
                    };

                    const result = await gemini.analyzeScrapedContent(rawContent, currentTime, venueContext, source.target as any);

                    // [DATA SINK] Route data based on target
                    if (source.target === 'EVENTS' && Array.isArray(result)) {
                        for (const eventData of result) {
                            if (eventData.sourceConfidence < 0.7) continue;
                            const startTime = new Date(eventData.date + 'T' + (eventData.time || '00:00')).getTime();
                            if (startTime < Date.now()) continue;

                            await this.saveEvent(venue.id, { ...eventData, startTime });
                        }
                        console.log(`[Scraper] Synced ${result.length} events.`);
                    }
                    else if (source.target === 'MENU' && result) {
                        await db.collection('venues').doc(venue.id).update({
                            'ai_draft_profile.menu_highlights': result
                        });
                        console.log(`[Scraper] Updated Menu Highlights.`);
                    }
                    else if (source.target === 'NEWSLETTER' && result?.newsItems?.length > 0) {
                        await this.createSocialDraft(venue.id, result.newsItems, source.url);
                        console.log(`[Scraper] Created User Draft from Newsletter.`);
                    }

                    // Success Update
                    source.status = 'active';
                    source.lastScraped = Date.now();
                    source.errorMsg = undefined;
                    source.consecutiveFailures = 0;

                } catch (error: any) {
                    console.error(`[Scraper] Source Failed: ${source.url}`, error.message);
                    source.status = 'error';
                    source.errorMsg = error.message;
                    source.consecutiveFailures = (source.consecutiveFailures || 0) + 1;
                }
            }

            // [PERSIST CONFIG UPDATES] Save status/timestamp changes back to venue
            // Note: If we are using the 'legacy-migrated' adapter, this won't persist to scraper_config unless we write it.
            // Ideally we should migrate the venue for real here.
            if (venue.scraper_config) {
                await db.collection('venues').doc(venue.id).update({
                    scraper_config: configs,
                    last_scrape_timestamp: Date.now()
                });
            } else if (configs.length > 0 && configs[0].id === 'legacy-migrated') {
                // Determine if we should perform a hard migration. Let's do it.
                await db.collection('venues').doc(venue.id).update({
                    scraper_config: configs, // Writes the adapted config to DB
                    last_scrape_timestamp: Date.now()
                });
                console.log(`[Scraper] Migrated legacy URL to scraper_config for ${venue.name}`);
            }

        } catch (error: any) {
            console.error(`[Scraper] Critical Browser Error for ${venue.name}:`, error);
        } finally {
            if (browser) await browser.close();
        }
    }

    /**
     * Saves a parsed event to the league_events collection.
     */
    private static async saveEvent(venueId: string, data: any) {
        // Deterministic ID to prevent duplicates (venue + slug + date)
        const titleSlug = data.title.toLowerCase().replace(/[^a-z0-9]/g, '');
        const hashInput = `${venueId}_${titleSlug}_${data.date}`;
        const eventId = `scraped_${createHash('md5').update(hashInput).digest('hex')}`;

        const event: LeagueEvent = {
            id: eventId,
            venueId,
            title: data.title,
            description: data.description,
            type: data.type,
            startTime: data.startTime,
            date: data.date,
            time: data.time,
            pointsAwarded: 25, // Standard scraped event bounty
            sourceConfidence: data.sourceConfidence || 0,
            lastScraped: Date.now(),
            source: 'automation'
        };

        await db.collection('league_events').doc(eventId).set(event, { merge: true });
    }

    private static async createSocialDraft(venueId: string, newsItems: string[], sourceUrl: string) {
        // Create a draft post for the owner to approve
        const draftId = randomUUID();
        await db.collection('social_post_drafts').doc(draftId).set({
            id: draftId,
            venueId,
            sourceType: 'NEWSLETTER',
            content: `📢 Fresh News!\n\n${newsItems.join('\n• ')}\n\n(Source: ${sourceUrl})`,
            sourceUrl,
            status: 'DRAFT',
            createdAt: Date.now()
        });
    }

    private static async logScrapeHistory(venueId: string, log: any) {
        try {
            await db.collection('scrape_history').add({
                venueId,
                ...log
            });
        } catch (e) {
            console.error("[Scraper] Failed to log history:", e);
        }
    }
}
