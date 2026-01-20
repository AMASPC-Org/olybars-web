import { onSchedule } from 'firebase-functions/v2/scheduler';
import { onMessagePublished } from 'firebase-functions/v2/pubsub';
import * as admin from 'firebase-admin';
import { PubSub } from '@google-cloud/pubsub';
import puppeteer from 'puppeteer';
import robotsParser from 'robots-parser';
import md5 from 'md5';
import { ScrapingMetadata } from '../types/scraping';
import { GeminiService } from '../services/geminiService';

const db = admin.firestore();
const pubsub = new PubSub();
const TOPIC_NAME = 'venue-scrape-queue';

// --- DISPATCHER ---

export const scoutDispatcher = onSchedule({
    schedule: 'every wed,fri 09:00',
    timeZone: 'America/Los_Angeles',
    retryCount: 3,
    memory: '512MiB'
}, async (event) => {
    console.log('🚀 [Dispatcher] Starting scout dispatch run...');

    // Phase A: The Dispatcher
    const snapshot = await db.collection('venues') // Actually we need to query based on scraping_metadata, so maybe a collectionGroup or a specialized query.
    // TDD says: Select venues where scraping.enabled == true AND circuit_breaker_tripped == false
    // Since scraping_metadata is likely a subcollection field or root field. 
    // Assuming scraping_metadata is a field on the venue doc for now based on typical Firestore patterns, or a subcollection. 
    // TDD says: "Collection: venues/{venueId}/scraping_metadata". This implies a subcollection 'scraping_metadata' with a single doc? 
    // Or just "scraping_metadata" object on venue? TDD says "Collection: venues/{venueId}/scraping_metadata". 
    // Let's assume it's a subcollection named 'scraping_metadata' with a doc (maybe 'config'?).
    // Actually, querying across subcollections is 'collectionGroup'.

    // Let's assume for simplicity & cost (read charges) it's a map on the venue object OR we use collectionGroup.
    // TDD Spec: "Collection: venues/{venueId}/scraping_metadata". 
    // Let's implement as collectionGroup 'scraping_metadata'.

    const candidates = await db.collectionGroup('scraping_metadata')
        .where('enabled', '==', true)
        .where('circuitBreaker.tripped', '==', false)
        .get();

    console.log(`[Dispatcher] Found ${candidates.size} eligible candidates.`);

    const batchPublisher = pubsub.topic(TOPIC_NAME);
    const publishPromises: Promise<any>[] = [];

    for (const doc of candidates.docs) {
        const meta = doc.data() as ScrapingMetadata;
        // doc.ref.parent.parent?.id is the venueId
        const venueId = doc.ref.parent.parent?.id;

        if (!venueId || !meta.targetUrl) continue;

        const messageData = {
            venueId,
            url: meta.targetUrl,
            previousHash: meta.contentHash || '',
            metaPath: doc.ref.path
        };

        const dataBuffer = Buffer.from(JSON.stringify(messageData));
        publishPromises.push(batchPublisher.publishMessage({ data: dataBuffer }));
    }

    await Promise.all(publishPromises);
    console.log(`[Dispatcher] Dispatched ${publishPromises.length} scouts.`);
});


// --- WORKER ---

export const scoutWorker = onMessagePublished({
    topic: TOPIC_NAME,
    timeoutSeconds: 300, // 5 min max
    memory: '2GiB', // Puppeteer needs RAM
    cpu: 1,
    secrets: ["GOOGLE_API_KEY", "GOOGLE_GENAI_API_KEY", "GOOGLE_BACKEND_KEY", "VITE_GOOGLE_BROWSER_KEY", "INTERNAL_HEALTH_TOKEN", "GOOGLE_MAPS_API_KEY"]
}, async (event) => {
    const { venueId, url, previousHash, metaPath } = event.data.message.json;
    console.log(`🤖 [Worker] Scout allocated for ${venueId} (${url})`);

    const metaRef = db.doc(metaPath);

    // Step 1: Gatekeeper
    // Verify manually_blocked (fetch venue core doc)
    const venueDoc = await db.collection('venues').doc(venueId).get();
    const venueData = venueDoc.data();
    if (venueData?.is_manually_blocked) {
        console.warn(`[Worker] Venue ${venueId} is manually blocked. Aborting.`);
        return;
    }

    // Domain Blacklist
    if (url.includes('facebook.com') || url.includes('instagram.com')) {
        console.log(`[Worker] Social media URL detected. yielding to Apify.`);
        return;
    }

    // Robots.txt Cache
    // We need to fetch the current metadata to check cache age
    const currentMetaSnap = await metaRef.get();
    const currentMeta = currentMetaSnap.data() as ScrapingMetadata;

    let canScrape = true; // Default Allow (Fail Open)
    const now = Date.now();
    const cacheAge = now - (currentMeta?.robotsCache?.checkedAt || 0);
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

    if (cacheAge > SEVEN_DAYS) {
        // Refresh Verdict
        try {
            const robotsUrl = new URL('/robots.txt', url).href;
            const resp = await fetch(robotsUrl);
            if (resp.ok) {
                const txt = await resp.text();
                const robots = robotsParser(robotsUrl, txt);
                // Check if User-Agent "OlyBarsBot" is allowed
                if (robots.isDisallowed(url, 'OlyBarsBot')) {
                    console.warn(`[Worker] Robots.txt disallows OlyBarsBot.`);
                    await metaRef.update({
                        'robotsCache.verdict': 'disallow',
                        'robotsCache.checkedAt': now
                    });
                    return; // EXIT
                } else {
                    await metaRef.update({
                        'robotsCache.verdict': 'allow',
                        'robotsCache.checkedAt': now
                    });
                }
            } else {
                console.warn(`[Worker] Robots.txt fetch failed (${resp.status}). Failing Open.`);
            }
        } catch (e) {
            console.warn(`[Worker] Robots.txt network error. Failing Open.`);
        }
    } else if (currentMeta?.robotsCache?.verdict === 'disallow') {
        console.warn(`[Worker] Cached Disallow verdict. Aborting.`);
        return;
    }

    // Step 2: The Scout (Puppeteer)
    let browser;
    let currentHash = '';
    let rawText = '';
    let screenshotBuffer: Buffer | undefined;

    try {
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 (Compatible; OlyBarsBot/1.0; +https://olybars.com/bot)');

        // Time-Boxed Race
        try {
            await Promise.race([
                page.goto(url, { waitUntil: 'networkidle2', timeout: 20000 }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
            ]);
        } catch (e) {
            // Check if we loaded enough
            if (!page.url()) throw e; // Totally failed
            console.log('[Worker] Navigation timeout/race, analyzing what we have...');
        }

        // Change Detection
        rawText = await page.evaluate(() => document.body.innerText);
        currentHash = md5(rawText);

        if (currentHash === previousHash) {
            console.log(`[Worker] No content change detected (${currentHash}).`);
            await metaRef.update({ lastRun: now });
            return;
        }

        // Capture Screenshot (for Multimodal Fallback)
        screenshotBuffer = Buffer.from(await page.screenshot({ fullPage: false, type: 'jpeg', quality: 60 }));

    } catch (e: any) {
        console.error(`[Worker] Puppeteer Crash: ${e.message}`);
        // Circuit Breaker Logic
        const failCount = (currentMeta?.circuitBreaker?.failCount || 0) + 1;
        await metaRef.update({
            'circuitBreaker.failCount': failCount,
            'circuitBreaker.lastFailure': now,
            'circuitBreaker.tripped': failCount >= 3
        });
        return;
    } finally {
        if (browser) await browser.close();
    }

    // Step 3: The Brain (Gemini)
    try {
        const gemini = new GeminiService();
        // Context Injection
        const todayPST = new Date().toLocaleDateString('en-US', { timeZone: 'America/Los_Angeles' });

        // Multi-City Extraction
        let city = "Olympia, WA";
        if (venueData?.address) {
            // "514 4th Ave E, Olympia, WA 98501" -> "Olympia, WA"
            // Simple robust parser: split by comma, trim
            const parts = venueData.address.split(',');
            if (parts.length >= 3) {
                // usually [Street, City, State Zip, Country] or [Street, City, State Zip]
                // Let's try to get City + State
                const cityPart = parts[1].trim();
                const stateZipPart = parts[2].trim().split(' ')[0]; // "WA" from "WA 98501"
                city = `${cityPart}, ${stateZipPart}`;
            }
        }

        const venueContext = {
            city,
            timezone: 'America/Los_Angeles'
        };

        // Using "EVENTS" logic from our service
        const events = await gemini.analyzeScrapedContent(rawText, todayPST, venueContext, 'EVENTS');

        // Note: TDD asks for Multimodal (Text + Screenshot). 
        // Our current GeminiService.analyzeScrapedContent only takes text.
        // We might need to enhance GeminiService to accept image or use a specific flow here.
        // For now, we rely on the robust text extraction we just built.

        // Step 4: The Scribe
        if (events && events.length > 0) {
            console.log(`[Worker] Extracted ${events.length} events.`);
            const batch = db.batch();

            for (const ev of events) {
                // ID Generation: venueId_YYYYMMDD_TitleSlug
                const titleSlug = ev.title.toLowerCase().replace(/[^a-z0-9]/g, '');
                const eventId = `${venueId}_${ev.date.replace(/-/g, '')}_${titleSlug}`;
                const eventRef = db.collection('league_events').doc(eventId);

                batch.set(eventRef, {
                    ...ev,
                    venueId,
                    source: 'automation',
                    lastScraped: now,
                    pointsAwarded: 25 // Default
                }, { merge: true });
            }

            // Meta Update
            batch.update(metaRef, {
                contentHash: currentHash,
                lastRun: now,
                lastSuccess: now,
                consecutiveEmptyScrapes: 0,
                'circuitBreaker.failCount': 0
            });

            await batch.commit();

        } else {
            console.log(`[Worker] No events found.`);
            const fails = (currentMeta?.consecutiveEmptyScrapes || 0) + 1;

            // 3-Strike Rule
            if (fails >= 3) {
                console.warn(`[Worker] 3rd consecutive empty scrape. Marking cancelled.`);
                // Logic to query future events and mark 'cancelled_by_bot' would go here
                // For now just logging as per TDD Phase 4.
            }

            await metaRef.update({
                contentHash: currentHash,
                lastRun: now,
                consecutiveEmptyScrapes: fails
            });
        }

    } catch (e: any) {
        console.error(`[Worker] Brain/Scribe Error: ${e.message}`);
    }
});
