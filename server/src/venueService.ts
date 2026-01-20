import { PULSE_CONFIG } from '../../src/config/pulse.js';
import { db } from './firebaseAdmin.js';

import { Venue, Signal, SignalType, Badge, UserBadgeProgress, VenueStatus, GameStatus } from '../../src/types.js';
import { geocodeAddress } from './utils/geocodingService.js';
import { searchPlace, getPlaceDetails } from './utils/placesService.js';
import { BADGES } from '../../src/config/badges.js';

// In-memory cache for venues (TTL: 60 seconds)
let venueCache: { data: Venue[], lastFetched: number } | null = null;
const CACHE_TTL = 60 * 1000;

/**
 * [SECURITY] Zero-Trust Striping
 * Removes sensitive partner data from public objects.
 */
const stripSensitiveVenueData = (venue: Venue, brief = false): Venue => {
    const stripped = { ...venue };

    // 1. Root level sensitive fields
    const sensitiveFields: (keyof Venue)[] = ['partnerConfig', 'pointBank', 'pointBankLastReset', 'wifiPassword', 'posKey'];
    sensitiveFields.forEach(field => delete (stripped as any)[field]);

    // 2. Menu level metadata (Margin Tiers)
    if (stripped.fullMenu) {
        stripped.fullMenu = stripped.fullMenu.map(item => {
            const safeItem = { ...item };
            delete (safeItem as any).margin_tier;
            return safeItem as any;
        });
    }

    // 3. [PERFORMANCE] Brief Mode Stripping
    if (brief) {
        const briefFields: (keyof Venue)[] = [
            'fullMenu',
            'originStory',
            'insiderVibe',
            'soberFriendlyReports',
            'manualStatus',
            'manualStatusExpiresAt',
            'manualClockIns',
            'manualClockInsExpiresAt',
            'loyalty_signup_url',
            'newsletterUrl',
            'ticketLink',
            'historySnippet',
            'ai_draft_profile'
        ];
        briefFields.forEach(field => delete (stripped as any)[field]);

        // Keep only the primary photo in brief mode
        if (stripped.photos && stripped.photos.length > 1) {
            stripped.photos = [stripped.photos[0]];
        }
    }

    return stripped;
};

/**
 * Buzz Clock Sorting Logic:
 * 1. Sort by dealEndsIn (shortest duration first).
 * 2. Push any venues with dealEndsIn > 240 minutes to the bottom.
 * 3. Venues without deals go to the absolute bottom.
 */
const sortVenuesByBuzzClock = (venues: Venue[]): Venue[] => {
    return [...venues].sort((a, b) => {
        const aTime = a.dealEndsIn ?? Infinity;
        const bTime = b.dealEndsIn ?? Infinity;

        const aIsLong = aTime > 240;
        const bIsLong = bTime > 240;

        // If one is "long" and the other isn't, handle priority
        if (aIsLong && !bIsLong) return 1;
        if (!aIsLong && bIsLong) return -1;

        // If both are same "long-ness", sort by time
        // If both are Infinity, they remain equal (0)
        if (aTime === bTime) return 0;
        return aTime < bTime ? -1 : 1;
    });
};

/**
 * Geofencing: Haversine distance in meters
 */
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // in metres
};



/**
 * Buzz Algorithm (Doc 05 Rulebook):
 * Updated Dec 24: Uses Centralized Pulse Logic Config
 */
export const updateVenueBuzz = async (venueId: string) => {
    const now = Date.now();
    const twelveHoursAgo = now - PULSE_CONFIG.WINDOWS.BUZZ_HISTORY;
    const liveWindowAgo = now - PULSE_CONFIG.WINDOWS.LIVE_HEADCOUNT;

    // Filter by venueId only
    const signalsSnapshot = await db.collection('signals')
        .where('venueId', '==', venueId)
        .where('timestamp', '>', twelveHoursAgo) // Optimization: limit query
        .get();

    let score = 0;
    const activeUserIds = new Set<string>();

    signalsSnapshot.forEach(doc => {
        const data = doc.data() as Signal;

        // 1. Calculate Buzz Score
        let signalValue = 0;
        if (data.type === 'clock_in') signalValue = PULSE_CONFIG.POINTS.CLOCK_IN;
        if (data.type === 'vibe_report') signalValue = PULSE_CONFIG.POINTS.VIBE_REPORT;

        // Recency Decay: 50% drop every HALFLIFE (default 60 mins)
        const ageInHours = (now - data.timestamp) / PULSE_CONFIG.WINDOWS.DECAY_HALFLIFE;
        const decayedValue = signalValue * Math.pow(0.5, ageInHours);
        score += decayedValue;

        // 2. Calculate Live Headcount (Rolling Window)
        // [Unified Density] Count Vibe Reports as "Bodies" too
        if (data.timestamp > liveWindowAgo && (data.type === 'clock_in' || data.type === 'vibe_report')) {
            activeUserIds.add(data.userId);
        }
    });

    const venueDoc = await db.collection('venues').doc(venueId).get();
    const venueData = venueDoc.data();

    const oldStatus = venueData?.status;

    // 4. Consensus Algorithm Logic (Rule 05-X - Beta Battalion Pivot)
    const consensusClockinWindow = now - PULSE_CONFIG.CONSENSUS.CLOCKIN_WINDOW;
    const consensusVibeWindow = now - PULSE_CONFIG.CONSENSUS.VIBE_WINDOW;

    const consensusClockins = new Set<string>();
    const consensusVibeReports = new Set<string>();

    signalsSnapshot.forEach(doc => {
        const data = doc.data() as Signal;
        if (data.timestamp > consensusClockinWindow && data.type === 'clock_in') {
            consensusClockins.add(data.userId);
        }
        if (data.timestamp > consensusVibeWindow && data.type === 'vibe_report' && data.value?.status === 'packed') {
            consensusVibeReports.add(data.userId);
        }
    });

    const isConsensusPacked =
        consensusClockins.size >= PULSE_CONFIG.CONSENSUS.CLOCKINS_REQUIRED ||
        consensusVibeReports.size >= PULSE_CONFIG.CONSENSUS.VIBE_REPORTS_REQUIRED;

    // [Relative Density] Calculate Saturation
    const capacity = venueData?.capacity || PULSE_CONFIG.PHYSICS.DEFAULT_CAPACITY;
    const saturation = score / capacity;

    // If consensus is met, force 'packed'. Otherwise follow saturation-based status.
    let calibratedStatus: VenueStatus = 'mellow';
    if (saturation > PULSE_CONFIG.THRESHOLDS.PACKED) calibratedStatus = 'packed';
    else if (saturation > PULSE_CONFIG.THRESHOLDS.BUZZING) calibratedStatus = 'buzzing';
    else if (saturation > PULSE_CONFIG.THRESHOLDS.CHILL) calibratedStatus = 'chill';

    if (isConsensusPacked) calibratedStatus = 'packed';

    // Manual Overrides (Owner/Admin Control) - Still respected for UI, but SMS trigger is consensus-only
    const finalStatus = (venueData?.manualStatus && venueData?.manualStatusExpiresAt > now)
        ? venueData.manualStatus
        : calibratedStatus;

    const finalClockIns = (venueData?.manualClockIns !== undefined && venueData?.manualClockInsExpiresAt > now)
        ? venueData.manualClockIns
        : activeUserIds.size;

    await db.collection('venues').doc(venueId).update({
        'currentBuzz.score': score,
        'currentBuzz.lastUpdated': now,
        'status': finalStatus,
        'clockIns': finalClockIns
    });

    // 5. Trigger Pulse Alert (ONLY ON CONSENSUS TRANSITION)
    // We only trigger SMS if the consensus itself flips to packed, regardless of manual override.
    // This protects from 'Andy the Owner' over-promoting.
    const wasConsensusPacked = (venueData as any)?.isConsensusPacked || false;

    if (isConsensusPacked && !wasConsensusPacked) {
        const { NotificationService } = await import('./services/NotificationService.js');
        await NotificationService.dispatchPulseAlert(venueId, venueData?.name || 'A venue');

        // Persist consensus state to avoid duplicate alerts
        await db.collection('venues').doc(venueId).update({
            isConsensusPacked: true
        });
    } else if (!isConsensusPacked && wasConsensusPacked) {
        // Reset consensus state when it drops below threshold
        await db.collection('venues').doc(venueId).update({
            isConsensusPacked: false
        });
    }

    // Invalidate cache
    venueCache = null;
};

/**
 * calculateVirtualBuzz (Rule 05-V):
 * Calculates real-time decayed score without DB writes.
 */
const applyVirtualDecay = (venue: Venue): Venue => {
    const now = Date.now();

    // 1. Calculate Virtual Buzz (Decay)
    let decayedScore = venue.currentBuzz?.score || 0;
    if (venue.currentBuzz?.score && venue.currentBuzz.lastUpdated) {
        const ageInMs = now - venue.currentBuzz.lastUpdated;
        const decayHours = PULSE_CONFIG.WINDOWS.DECAY_HALFLIFE / (60 * 60 * 1000);
        const ageInHours = ageInMs / (60 * 60 * 1000);
        decayedScore = venue.currentBuzz.score * Math.pow(0.5, ageInHours / decayHours);
    }

    // 2. Determine Status (Respect Manual Override)
    let status = venue.status;
    if (!(venue.manualStatus && venue.manualStatusExpiresAt && venue.manualStatusExpiresAt > now)) {
        const capacity = venue.capacity || PULSE_CONFIG.PHYSICS.DEFAULT_CAPACITY;
        const saturation = decayedScore / capacity;

        status = 'dead';
        if (saturation > PULSE_CONFIG.THRESHOLDS.PACKED) status = 'packed';
        else if (saturation > PULSE_CONFIG.THRESHOLDS.BUZZING) status = 'buzzing';
        else if (saturation > PULSE_CONFIG.THRESHOLDS.CHILL) status = 'chill';
        else status = 'dead';
    }

    // 3. Determine Clock-ins (Respect Manual Override)
    let clockIns = venue.clockIns || 0;
    if (venue.manualClockIns !== undefined && venue.manualClockInsExpiresAt && venue.manualClockInsExpiresAt > now) {
        clockIns = venue.manualClockIns;
    }

    return {
        ...venue,
        currentBuzz: {
            ...venue.currentBuzz,
            score: decayedScore,
            lastUpdated: venue.currentBuzz?.lastUpdated || now
        },
        status: status as any,
        clockIns
    };
};

/**
 * Background Refresh for Venue Cache (SWR Pattern)
 */
const refreshVenueCache = async (): Promise<Venue[]> => {
    const now = Date.now();
    try {
        const snapshot = await db.collection('venues').get();

        const venues = snapshot.docs
            .map(doc => {
                const data = doc.data();
                const venue = { id: doc.id, ...data } as Venue;

                return venue;
            })
            .filter(v => v.isActive !== false);

        const sortedVenues = sortVenuesByBuzzClock(venues);

        venueCache = {
            data: sortedVenues,
            lastFetched: now
        };

        return sortedVenues;
    } catch (error) {
        console.error('Error refreshing venue cache:', error);
        throw error;
    }
};

/**
 * Fetch a single venue by ID (Full Data)
 */
export const getVenueById = async (venueId: string): Promise<Venue | null> => {
    // Check cache first
    if (venueCache) {
        const cached = venueCache.data.find(v => v.id === venueId);
        if (cached) return applyVirtualDecay(stripSensitiveVenueData(cached, false));
    }

    try {
        const doc = await db.collection('venues').doc(venueId).get();
        if (!doc.exists) return null;

        const data = doc.data();
        const venue = { id: doc.id, ...data } as Venue;

        return applyVirtualDecay(stripSensitiveVenueData(venue, false));
    } catch (error) {
        console.error(`Error fetching venue ${venueId}:`, error);
        return null;
    }
};

export const fetchVenues = async (brief = false): Promise<Venue[]> => {
    const now = Date.now();

    // 1. SWR logic: Return cache immediately, refresh in background if stale
    if (venueCache) {
        const isStale = (now - venueCache.lastFetched) > CACHE_TTL;
        if (isStale) {
            // Background refresh
            refreshVenueCache().catch(err => console.error('[Backend] Background cache update failed:', err));
        }
        return venueCache.data.map(applyVirtualDecay).map(v => stripSensitiveVenueData(v, brief));
    }

    // 2. No cache: Initial load
    const data = await refreshVenueCache();
    return data.map(applyVirtualDecay).map(v => stripSensitiveVenueData(v, brief));
};


export const clockIn = async (venueId: string, userId: string, userLat: number, userLng: number, verificationMethod: 'gps' | 'qr' = 'gps') => {
    const venueDoc = await db.collection('venues').doc(venueId).get();
    if (!venueDoc.exists) throw new Error('Venue not found');

    const venueData = venueDoc.data() as Venue;
    if (!venueData.location) {
        // If no real location set, skip geofencing for dev
        console.warn(`Geofencing skipped for ${venueId} - no location set.`);
    } else {
        const distance = calculateDistance(userLat, userLng, venueData.location.lat, venueData.location.lng);
        if (distance > PULSE_CONFIG.SPATIAL.GEOFENCE_RADIUS) {
            throw new Error(`Too far away! You are ${Math.round(distance)}m from ${venueData.name}.`);
        }
    }

    // [BETA BATTALION] Add Signal BEFORE point checks to ensure consensus accuracy
    // even if the user is point-capped or throttled.
    const timestamp = Date.now();
    const signal: Partial<Signal> = {
        venueId,
        userId,
        type: 'clock_in',
        timestamp,
        verificationMethod
    };

    // Check for recent signal from this user to prevent double-counting/spam (5 min window)
    const recentDuplicate = await db.collection('signals')
        .where('userId', '==', userId)
        .where('venueId', '==', venueId)
        .where('type', '==', 'clock_in')
        .where('timestamp', '>', timestamp - (5 * 60 * 1000))
        .limit(1)
        .get();

    if (recentDuplicate.empty) {
        await db.collection('signals').add(signal);
    }
    if (venueData.ownerId === userId || venueData.managerIds?.includes(userId)) {
        throw new Error('Conflict of Interest: Venue staff and management are not eligible for League points at their own establishment.');
    }

    // 1. Conflict of Interest Check (Rule 03-B)

    // 2. LCB Compliance Check (Rule 03-A) & Nightly Cap
    // WA State law limits users to 2 League clock-ins per 12-hour window.
    // Also enforcing the OlyBars 4:00 AM Business Day cap of 2.
    const today4AM = new Date();
    today4AM.setHours(4, 0, 0, 0);
    const businessDayStart = (timestamp < today4AM.getTime())
        ? today4AM.getTime() - 24 * 60 * 60 * 1000
        : today4AM.getTime();

    const lcbWindowAgo = timestamp - PULSE_CONFIG.WINDOWS.LCB_WINDOW;
    const windowStart = Math.min(businessDayStart, lcbWindowAgo);

    const clockinsLastWindow = await db.collection('signals')
        .where('userId', '==', userId)
        .where('type', '==', 'clock_in')
        .where('timestamp', '>', windowStart)
        .get();

    if (clockinsLastWindow.size >= 2) {
        throw new Error('Nightly Cap Reached: You have reached the limit of 2 League clock-ins for this window. Please try again tomorrow after 4:00 AM!');
    }

    // 3. Throttling & Impossible Movement (Rule 03-C)
    const recentSignals = await db.collection('signals')
        .where('userId', '==', userId)
        .where('type', '==', 'clock_in')
        .orderBy('timestamp', 'desc')
        .limit(1)
        .get();

    if (!recentSignals.empty) {
        const lastClockIn = recentSignals.docs[0].data() as Signal;
        const timeSinceLast = timestamp - lastClockIn.timestamp;
        const timeDiffSec = timeSinceLast / 1000;

        // Impossible Movement Check (Centralized from Frontend)
        if (venueData.location && lastClockIn.venueId !== venueId) {
            const lastVenueDoc = await db.collection('venues').doc(lastClockIn.venueId).get();
            const lastVenueData = lastVenueDoc.data() as Venue;

            if (lastVenueData?.location) {
                const distMeters = calculateDistance(
                    lastVenueData.location.lat, lastVenueData.location.lng,
                    venueData.location.lat, venueData.location.lng
                );

                // Threshold: 100mph (approx 44.7 m/s)
                const speedMps = distMeters / timeDiffSec;
                if (speedMps > 44.7 && timeDiffSec > 60) { // 1 min buffer for very close venues
                    console.warn(`[ANTI-CHEAT] Impossible Movement: ${userId} moved ${Math.round(distMeters)}m in ${Math.round(timeDiffSec)}s (${Math.round(speedMps * 2.237)} mph)`);
                    throw new Error('Impossible Movement detected! Please engage responsibly and stay within local travel speeds.');
                }
            }
        }

        // Global Throttle
        if (timeSinceLast < PULSE_CONFIG.WINDOWS.CLOCK_IN_THROTTLE) {
            const minutesSinceLast = Math.floor(timeSinceLast / (60 * 1000));
            const waitTime = (PULSE_CONFIG.WINDOWS.CLOCK_IN_THROTTLE / (60 * 1000)) - minutesSinceLast;
            throw new Error(`Slow down, League Legend! The Pulse needs a bit more time. You can clock in again in ${Math.ceil(waitTime)} minutes.`);
        }

        // Same-Venue Throttle
        if (lastClockIn.venueId === venueId && timeSinceLast < PULSE_CONFIG.WINDOWS.SAME_VENUE_THROTTLE) {
            const waitTime = (PULSE_CONFIG.WINDOWS.SAME_VENUE_THROTTLE - timeSinceLast) / (60 * 1000);
            throw new Error(`Already clocked in here recently! Please wait another ${Math.floor(waitTime / 60)} hours and ${Math.ceil(waitTime % 60)} minutes before clocking into ${venueData.name} again.`);
        }
    }

    // [REMOVED] Signal added earlier above
    // Check for Active Events at this venue
    let eventBonus = 0;
    try {
        const eventsSnapshot = await db.collection('events')
            .where('venueId', '==', venueId)
            .where('status', '==', 'approved')
            .get();

        const now = new Date();
        const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        const currentDateStr = now.toISOString().split('T')[0];

        eventsSnapshot.forEach(doc => {
            const event = doc.data();
            // Simple string comparison for time (assuming "HH:MM" format)
            // Current OlyBars logic: event happens "now" if it's on this date and time is within window
            // Since our current Event schema only has 'time' (start time), we'll assume a 3-hour window
            if (event.date === currentDateStr) {
                const [eventH, eventM] = event.time.split(':').map(Number);
                const eventDate = new Date(now);
                eventDate.setHours(eventH, eventM, 0, 0);

                const windowEnd = new Date(eventDate.getTime() + (3 * 60 * 60 * 1000)); // 3 hour window

                if (now >= eventDate && now <= windowEnd) {
                    eventBonus = 50;
                }
            }
        });
    } catch (e) {
        console.error('[EVENT_BONUS_ERROR] Failed to check for events:', e);
    }

    // Calculate Dynamic Points (The Pioneer Curve - Refactored Jan 2026)
    // Mellow: 100, Chill: 50, Buzzing: 25, Packed: 10
    const basePoints = PULSE_CONFIG.POINTS.VIBE_POINTS[venueData.status as VenueStatus] || PULSE_CONFIG.POINTS.VIBE_POINTS.mellow;
    let points = basePoints + eventBonus;
    const isLocalMakerSupporter = venueData.isLocalMaker === true;

    if (isLocalMakerSupporter) {
        points = Math.round((basePoints * 1.5) + eventBonus);
    }

    // Pass calculated points to the activity logger
    // We log it here to ensure backend source of truth
    await logUserActivity({
        userId,
        type: 'clock_in',
        venueId,
        points,
        verificationMethod,
        metadata: {
            basePoints,
            eventBonus,
            multiplier: isLocalMakerSupporter ? 1.5 : 1,
            isLocalMakerSupporter,
            vibeAtClockIn: venueData.status || 'mellow'
        }
    });

    // Recalculate Buzz
    await updateVenueBuzz(venueId);

    // 4. BADGE LOGIC: Check & Award Badges
    const newBadges = await checkAndAwardBadges(userId, venueId);
    let badgesAwarded: Badge[] = [];

    if (newBadges.length > 0) {
        // Award points for badges
        const totalBadgePoints = newBadges.reduce((sum, b) => sum + b.points, 0);
        points += totalBadgePoints;

        // Log Badge Activities
        for (const badge of newBadges) {
            await logUserActivity({
                userId,
                type: 'badge_unlock',
                points: badge.points,
                metadata: { badgeId: badge.id, badgeName: badge.name }
            });
            badgesAwarded.push(badge);
        }
    } else {
        // Only log the clock-in points if no badge activity already logged it (though we treat them separate)
        // Actually, logUserActivity is called above separately? No, checkIn function doesn't call logUserActivity yet for the checkin itself?
        // Wait, clockIn logic in this file returns points but doesn't seem to call logUserActivity for the clock-in points?
        // Let's check existing code. It seems checkIn returns points, and Frontend might be calling logUserActivity?
        // Or specific logUserActivity call is missing in checkIn?
        // Looking at previous `checkIn` code: "Pass calculated points to the activity logger (handled mostly by frontend currently...)"
        // OK, so backend just calculates. But for BADGES, we definitely want backend to handle it or return it.
        // I will return badgesAwarded in the response.
    }

    return {
        success: true,
        message: `Clocked in at ${venueData.name}!`,
        pointsAwarded: points,
        basePoints,
        eventBonus,
        isLocalMaker: venueData.isLocalMaker,
        badgesEarned: badgesAwarded
    };
};

/**
 * Perform a Vibe Check (Signal + Points)
 */
export const performVibeCheck = async (
    venueId: string,
    userId: string,
    status: VenueStatus,
    hasConsent: boolean,
    photoUrl?: string,
    verificationMethod: 'gps' | 'qr' = 'gps',
    gameStatus?: Record<string, GameStatus>,
    soberFriendlyCheck?: { isGood: boolean; reason?: string }
) => {
    const venueDoc = await db.collection('venues').doc(venueId).get();
    if (!venueDoc.exists) throw new Error('Venue not found');

    const venueData = venueDoc.data() as Venue;
    const now = Date.now();

    // 1. Calculate Points
    // Base Vibe Report: 5.0 (PULSE_CONFIG.POINTS.VIBE_REPORT)
    // Photo Bonus: 10.0 (PULSE_CONFIG.POINTS.PHOTO_VIBE)
    // Consent Bonus: 15.0 (PULSE_CONFIG.POINTS.VERIFIED_BONUS)

    let immediatePoints = PULSE_CONFIG.POINTS.VIBE_REPORT; // 5
    let bountyPoints = 0;
    let bountyPending = false;

    // Game Status Bonus (Flat 5 points for any update)
    let gameBonus = 0;
    if (gameStatus && Object.keys(gameStatus).length > 0) {
        gameBonus = 5;
        immediatePoints += gameBonus;
    }

    // Photo & Consent Validation (2-Hour Rule)
    if (photoUrl) {
        // Enforce 2-hour rule: Must be clocked in at this venue within last 2 hours
        const twoHoursAgo = now - (2 * 60 * 60 * 1000);
        const recentClockIn = await db.collection('signals')
            .where('userId', '==', userId)
            .where('venueId', '==', venueId)
            .where('type', '==', 'clock_in')
            .where('timestamp', '>', twoHoursAgo)
            .limit(1)
            .get();

        if (recentClockIn.empty) {
            throw new Error(`Bounty Error: You must be clocked in at ${venueData.name} within the last 2 hours to submit visual proof.`);
        }

        bountyPoints += PULSE_CONFIG.POINTS.PHOTO_VIBE; // 10
        if (hasConsent) {
            bountyPoints += PULSE_CONFIG.POINTS.VERIFIED_BONUS; // 15
        }
        bountyPending = true;
    }

    // 2. Create Signal (Important for Buzz)
    const signal: Partial<Signal> = {
        venueId,
        userId,
        type: 'vibe_report',
        timestamp: now,
        verificationMethod,
        value: {
            status,
            hasPhoto: !!photoUrl,
            gameCount: gameStatus ? Object.keys(gameStatus).length : 0
        }
    };
    await db.collection('signals').add(signal);

    // 3. Log User Activity (Points & Wallet)
    // Log Immediate Points (Base Vibe + Games)
    await logUserActivity({
        userId,
        type: 'vibe',
        venueId,
        points: immediatePoints,
        hasConsent,
        verificationMethod,
        metadata: {
            status,
            gameBonus
        }
    });

    // Log Pending Points (Photo + Verified Bonus)
    let submissionId = '';
    if (bountyPending) {
        const submissionRef = await db.collection('bounty_submissions').add({
            userId,
            venueId,
            photoUrl,
            submissionTime: now,
            clockInTime: now, // Simplification: we know they are in the window
            status: 'PENDING',
            pointsPotential: bountyPoints,
            createdAt: now
        });
        submissionId = submissionRef.id;

        await logUserActivity({
            userId,
            type: 'photo',
            venueId,
            points: bountyPoints,
            status: 'PENDING',
            metadata: {
                submissionId,
                photoUrl,
                bounty: venueData.activeFlashBounty?.title || 'Flash Bounty'
            }
        } as any);
    }

    // 4. Update Venue Data (Status, Photos, Games)
    const venueUpdates: any = {
        updatedAt: now,
        status: status, // Direct update (Buzz algo will eventually read signal too)
        'currentBuzz.lastUpdated': now
    };

    if (gameStatus) {
        // Merge with existing game status
        const existingGames = venueData.liveGameStatus || {};
        venueUpdates.liveGameStatus = { ...existingGames, ...gameStatus };
    }

    if (photoUrl) {
        const newPhoto = {
            id: `p-${now}-${Math.random().toString(36).substr(2, 6)}`,
            url: photoUrl,
            allowMarketingUse: hasConsent,
            marketingStatus: hasConsent ? 'pending-super' : undefined,
            timestamp: now,
            userId
        };
        const photos = venueData.photos || [];
        venueUpdates.photos = [...photos, newPhoto];
    }

    // --- SOBER FRIENDLY LOGIC ---
    if (soberFriendlyCheck && venueData.isSoberFriendly) {
        // 1. Verify GPS & Clock-in Signal (Anti-Griefing)
        const isGPS = verificationMethod === 'gps';
        const recentClockIn = await db.collection('signals')
            .where('userId', '==', userId)
            .where('venueId', '==', venueId)
            .where('type', '==', 'clock_in')
            .where('timestamp', '>', now - (12 * 60 * 60 * 1000)) // Within 12 hours
            .limit(1)
            .get();

        if (isGPS && !recentClockIn.empty) {
            const reports = venueData.soberFriendlyReports || [];

            // 2. User Cooldown (Anti-Snitch-Griefing: 30 days)
            const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
            const userRecentReport = reports.find(r => r.userId === userId && r.timestamp > thirtyDaysAgo);

            if (!userRecentReport) {
                // Add new report
                const newReport = {
                    userId,
                    timestamp: now,
                    reason: soberFriendlyCheck.isGood ? undefined : soberFriendlyCheck.reason
                };

                const updatedReports = [...reports, newReport];
                venueUpdates.soberFriendlyReports = updatedReports;

                if (!soberFriendlyCheck.isGood) {
                    // NEGATIVE REPORT PROCESSING
                    const negativeReports = updatedReports.filter(r => r.reason);

                    // A. Yellow Card Alert (First negative report)
                    if (negativeReports.length === 1) {
                        venueUpdates.soberFriendlyNote = "Heads up! A guest wasn't impressed with the NA options tonight. Check your stock.";
                    }

                    // B. Deactivation Logic
                    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
                    const recentNegatives = negativeReports.filter(r => r.timestamp > sevenDaysAgo);
                    const uniqueUserCount = new Set(recentNegatives.map(r => r.userId)).size;

                    const THRESHOLD_UNIQUE_7D = 3;
                    const THRESHOLD_TOTAL = 5;

                    if (uniqueUserCount >= THRESHOLD_UNIQUE_7D || negativeReports.length >= THRESHOLD_TOTAL) {
                        venueUpdates.isSoberFriendly = false;
                        venueUpdates.soberFriendlyNote = `Badge auto-disabled due to ${negativeReports.length} guest reports. Verify stock and request review to re-activate.`;

                        console.log(`[SOBER_FRIENDLY] Venue ${venueId} auto-disabled. Unique(7d): ${uniqueUserCount}, Total: ${negativeReports.length}`);
                    }
                } else {
                    // Positive report - could potentially clear recent negative warnings/notes if enough good ones come in?
                    // For now, just store it.
                }
            }
        }
    }

    await db.collection('venues').doc(venueId).update(venueUpdates);

    // Invalidate cache
    venueCache = null;

    // 5. Trigger Buzz Recalc
    await updateVenueBuzz(venueId);

    return {
        success: true,
        pointsAwarded: immediatePoints,
        bountyPending,
        submissionId: bountyPending ? submissionId : undefined,
        message: bountyPending
            ? `Vibe Verified! +${immediatePoints} Ops. Photo sent to Commissioner for ${bountyPoints}pt Bounty review.`
            : `Vibe Checked! You earned ${immediatePoints} Ops.`
    };
};

/**
 * Handle specific Amenity Clock-ins (5 points)
 */
export const clockInAmenity = async (venueId: string, userId: string, amenityId: string) => {
    const venueDoc = await db.collection('venues').doc(venueId).get();
    if (!venueDoc.exists) throw new Error('Venue not found');

    const venueData = venueDoc.data() as Venue;

    // Check if the venue actually has this amenity
    const amenity = venueData.gameFeatures?.find(a => a.id === amenityId);
    if (!amenity) throw new Error(`Venue does not have ${amenityId}`);

    const timestamp = Date.now();

    // Log Activity
    await logUserActivity({
        userId,
        type: 'play',
        venueId,
        points: 5,
        metadata: { amenityId, amenityName: amenity.name }
    });

    return {
        success: true,
        message: `Clocked in for ${amenity.name} at ${venueData.name}!`,
        pointsAwarded: 5
    };
};


/**
 * Check if the user has unlocked any new badges based on their history.
 */
export const checkAndAwardBadges = async (userId: string, currentVenueId: string): Promise<Badge[]> => {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    const userData = userDoc.data();
    const currentBadges = userData?.badges || {};

    // Get unique clock-ins history
    const signalsSnapshot = await db.collection('signals')
        .where('userId', '==', userId)
        .where('type', '==', 'clock_in')
        .get();

    const uniqueVenues = new Set<string>();
    signalsSnapshot.forEach(doc => {
        const data = doc.data() as Signal;
        uniqueVenues.add(data.venueId);
    });
    // Ensure current clock-in is counted (it was just added)
    uniqueVenues.add(currentVenueId);

    const newBadges: Badge[] = [];

    for (const badge of BADGES) {
        // Skip if already unlocked
        if (currentBadges[badge.id]?.unlocked) continue;

        let unlocked = false;

        if (badge.criteria.type === 'clockin_set' && badge.criteria.venueIds) {
            // Check if all required venues are visited
            const hasAll = badge.criteria.venueIds.every(vid => uniqueVenues.has(vid));
            if (hasAll) unlocked = true;
        } else if (badge.criteria.type === 'count' && badge.criteria.count) {
            const matchCount = (badge.criteria.venueIds || []).filter(vid => uniqueVenues.has(vid)).length;
            // If no venueIds loop provided (generic count), usually not supported yet or implies ANY venue. 
            // Assuming venueIds is required for specific counts, else we check basic count.
            if (badge.criteria.venueIds && matchCount >= badge.criteria.count) {
                unlocked = true;
            }
        }

        // --- Special Logic: The Historian ---
        if (badge.id === 'the_historian' && badge.criteria.isHistoricalAnchor && badge.criteria.timeWindowDays) {
            const historyLimit = Date.now() - (badge.criteria.timeWindowDays * 24 * 60 * 60 * 1000);

            const recentSignals = await db.collection('signals')
                .where('userId', '==', userId)
                .where('type', '==', 'clock_in')
                .where('timestamp', '>', historyLimit)
                .get();

            const recentVenueIds = new Set<string>();
            recentSignals.forEach(d => recentVenueIds.add(d.data().venueId));
            if (currentVenueId) recentVenueIds.add(currentVenueId);

            let historicalCount = 0;
            const recentVenues = Array.from(recentVenueIds);



            for (const vid of recentVenues) {
                const vDoc = await db.collection('venues').doc(vid).get();
                if (vDoc.exists && vDoc.data()?.isHistoricalAnchor) {
                    historicalCount++;
                }
            }

            if (historicalCount >= (badge.criteria.count || 3)) {
                unlocked = true;
            }
        }

        if (unlocked) {
            newBadges.push(badge);
            const badgeProgress: UserBadgeProgress = {
                badgeId: badge.id,
                progress: 1,
                unlocked: true,
                unlockedAt: Date.now()
            };
            // Update User Profile with new Badge
            await userRef.update({
                [`badges.${badge.id}`]: badgeProgress
            });
        } else {
            // Update progress if clockin_set
            if (badge.criteria.type === 'clockin_set' && badge.criteria.venueIds) {
                const visitedCount = badge.criteria.venueIds.filter(vid => uniqueVenues.has(vid)).length;
                const progress = visitedCount / badge.criteria.venueIds.length;

                await userRef.update({
                    [`badges.${badge.id}`]: {
                        badgeId: badge.id,
                        progress: progress,
                        unlocked: false,
                        completedVenueIds: badge.criteria.venueIds.filter(vid => uniqueVenues.has(vid))
                    }
                });
            }
        }
    }

    return newBadges;
};

/**
 * Log user activity and update user points in Firestore.
 */
export const logUserActivity = async (data: {
    userId: string,
    type: string,
    venueId?: string,
    points: number,
    hasConsent?: boolean,
    metadata?: any,
    verificationMethod?: 'gps' | 'qr'
}) => {
    const timestamp = Date.now();
    const logItem = {
        ...data,
        timestamp,
        receiptId: `rcpt_${timestamp}_${Math.random().toString(36).substring(2, 7)}`
    };

    // 1. Save to activity_logs collection
    await db.collection('activity_logs').add(logItem);

    // 2. Update user points in users collection
    const userRef = db.collection('users').doc(data.userId);
    const userDoc = await userRef.get();

    // [FLASH_BOUNTY] Skip point increment if status is PENDING
    const isPending = (data as any).status === 'PENDING';

    if (userDoc.exists) {
        const userData = userDoc.data();
        const updates: any = {
            'stats.lifetimeClockins': (data.type === 'clock_in' || data.type === 'clockin')
                ? (userData?.stats?.lifetimeClockins || 0) + 1
                : (userData?.stats?.lifetimeClockins || 0)
        };

        if (!isPending) {
            updates['stats.seasonPoints'] = (userData?.stats?.seasonPoints || 0) + data.points;
            updates['stats.competitionPoints'] = (userData?.stats?.competitionPoints || 0) + data.points;
        }

        await userRef.update(updates);
    } else {
        await userRef.set({
            uid: data.userId,
            stats: {
                seasonPoints: isPending ? 0 : data.points,
                competitionPoints: isPending ? 0 : data.points,
                lifetimeClockins: (data.type === 'clock_in' || data.type === 'clockin') ? 1 : 0,
                currentStreak: 0
            },
            role: 'user'
        });
    }

    return { success: true, pointsAwarded: data.points };
};

/**
 * Aggregate activity statistics for a venue over a specific period.
 */
export const getActivityStats = async (venueId: string, period: string) => {
    const now = Date.now();
    let startTime = now - (7 * 24 * 60 * 60 * 1000); // Default 1 week

    if (period === 'day') startTime = now - (24 * 60 * 60 * 1000);
    else if (period === 'month') startTime = now - (30 * 24 * 60 * 60 * 1000);
    else if (period === 'year') startTime = now - (365 * 24 * 60 * 60 * 1000);

    const snapshot = await db.collection('activity_logs')
        .where('venueId', '==', venueId)
        .where('timestamp', '>=', startTime)
        .get();

    let earned = 0;
    let redeemed = 0;
    const users = new Set();

    snapshot.forEach(doc => {
        const data = doc.data();
        if (data.type === 'redeem') {
            redeemed += Math.abs(data.points);
        } else {
            earned += data.points;
        }
        users.add(data.userId);
    });

    return {
        earned,
        redeemed,
        activeUsers: users.size,
        period
    };
};

/**
 * Update the approval status of a photo within a venue.
 */
export const updatePhotoStatus = async (
    venueId: string,
    photoId: string,
    updates: { isApprovedForFeed?: boolean, isApprovedForSocial?: boolean }
) => {
    const venueRef = db.collection('venues').doc(venueId);
    const venueDoc = await venueRef.get();

    if (!venueDoc.exists) throw new Error('Venue not found');

    const venueData = venueDoc.data() as Venue;
    const photos = venueData.photos || [];

    const updatedPhotos = photos.map(photo => {
        if (photo.id === photoId) {
            return { ...photo, ...updates };
        }
        return photo;
    });

    await venueRef.update({ photos: updatedPhotos });

    // Invalidate cache
    venueCache = null;

    return { success: true };
};
/**
 * Update general venue information (Listing management)
 */
export const updateVenue = async (venueId: string, updates: Partial<Venue>, requestingUserId?: string) => {
    const venueRef = db.collection('venues').doc(venueId);
    const venueDoc = await venueRef.get();

    if (!venueDoc.exists) throw new Error('Venue not found');
    const venueData = venueDoc.data() as Venue;

    // [SECURITY REMEDIATION A-01]
    // Verify ownership or management role
    let isAdmin = false;
    let isOwner = false;
    let isManager = false;

    if (requestingUserId) {
        // Fetch the user's role to check for admin bypass
        const userDoc = await db.collection('users').doc(requestingUserId).get();
        const userData = userDoc.data();
        isAdmin = userData?.role === 'super-admin' || userData?.role === 'admin' || userData?.email === 'ryan@amaspc.com';

        isOwner = venueData.ownerId === requestingUserId;
        isManager = !!venueData.managerIds?.includes(requestingUserId);
    } else {
        // If no user ID is provided, we strictly deny unless it's a known internal call (none yet)
        throw new Error('Unauthorized: Authentication required for venue updates.');
    }

    // Whitelist allowable fields based on role
    const adminOnlyFields: (keyof Venue)[] = [
        'isLocalMaker', 'makerType',
        'isPaidLeagueMember', 'tier_config',
        'hasGameVibeCheckEnabled'
    ];

    const ownerManagerFields: (keyof Venue)[] = [
        'name', 'nicknames',
        'address', 'description', 'hours', 'phone', 'website',
        'email', 'instagram', 'facebook', 'twitter',
        'gameFeatures', 'vibe', 'sceneTags', 'status',
        'originStory', 'insiderVibe', 'geoLoop',
        'isLowCapacity', 'isSoberFriendly',
        'physicalRoom', 'carryingMakers',
        'leagueEvent', 'triviaTime', 'deal', 'dealEndsIn', 'clockIns',
        'isActive',
        'googlePlaceId',
        'managersCanAddUsers',
        'liveGameStatus', 'photos',
        'manualStatus', 'manualStatusExpiresAt',
        'manualClockIns', 'manualClockInsExpiresAt',
        'happyHour', 'happyHourSpecials', 'happyHourSimple',
        'tier_config', 'hasGameVibeCheckEnabled',
        'fullMenu', // [PHASE 1] Menu Module
        'ai_draft_profile', // [PHASE 2] Data Refinery
        'location', 'coordinates', 'hasOutdoorSeating',
        'privateSpaces', 'hasPrivateRoom', // [FIX] Whitelist private spaces
        'isCinderella', 'cinderellaHours',
        'guestPolicy', 'membershipRequired',
        'social_auto_sync',
        'scraper_config', 'is_scraping_enabled', 'scrape_source_url',
        'wifiPassword', 'posKey', 'capacity',
        'venueType', 'reservations', 'reservationUrl', 'reservationPolicy',
        'ticketLink', 'giftCardUrl', 'loyalty_signup_url', 'newsletterUrl',
        'directMenuUrl', 'orderUrl'
    ];

    const playerFields: (keyof Venue)[] = ['status', 'liveGameStatus', 'photos'];

    const filteredUpdates: any = {};
    Object.keys(updates).forEach(key => {
        const field = key as keyof Venue;

        // Admins can change everything in the combined whitelist
        if (isAdmin && (adminOnlyFields.includes(field) || ownerManagerFields.includes(field))) {
            filteredUpdates[field] = updates[field];
        }
        // Owners/Managers can change non-admin fields
        else if (isOwner || isManager) {
            if (ownerManagerFields.includes(field)) {
                filteredUpdates[field] = updates[field];
            }
        }
        // Players/Users can only change status, liveGameStatus, and photos
        else if (playerFields.includes(field)) {
            filteredUpdates[field] = updates[field];
        }
    });

    // Special: If a status or game status update comes from a player, we should also trigger signal-based buzz updates
    if (filteredUpdates.status || filteredUpdates.liveGameStatus) {
        // We trigger buzz update in the background if possible
        // But for now we just rely on the direct update
    }

    // Authorization Check
    if (!isAdmin && !isOwner && !isManager) {
        // Regular players can only update playerFields
        const nonPlayerFields = Object.keys(filteredUpdates).filter(k => !playerFields.includes(k as any));
        if (nonPlayerFields.length > 0) {
            throw new Error('Unauthorized: You only have permission to update vibe and game status.');
        }
    }

    if (Object.keys(filteredUpdates).length === 0) {
        throw new Error('No valid update fields provided or insufficient permissions for selected fields.');
    }

    // [AUTO-GEOCODE] If address changed, resolve coordinates
    if (filteredUpdates.address && filteredUpdates.address !== venueData.address) {
        console.log(`[GEOCODE] Address changed for ${venueId}. Re-resolving coordinates...`);
        const geoResult = await geocodeAddress(filteredUpdates.address);
        if (geoResult) {
            filteredUpdates.location = { lat: geoResult.lat, lng: geoResult.lng };
            console.log(`[GEOCODE] Successfully resolved ${filteredUpdates.address} to ${geoResult.lat}, ${geoResult.lng}`);
        } else {
            console.warn(`[GEOCODE] Failed to resolve address: ${filteredUpdates.address}`);
        }
    }

    filteredUpdates.updatedAt = Date.now();
    await venueRef.update(filteredUpdates);

    // [CACHE_INVALIDATION] Force refresh on next fetch
    venueCache = null;

    return { success: true, updates: filteredUpdates };
};

/**
 * Sync a venue's details with Google Places API.
 */
export const syncVenueWithGoogle = async (venueId: string, manualPlaceId?: string) => {
    const venueRef = db.collection('venues').doc(venueId);
    const venueDoc = await venueRef.get();

    if (!venueDoc.exists) throw new Error('Venue not found');
    const venueData = venueDoc.data() as Venue;

    // [FINOPS] Safeguard: Prevent excessive syncs (max once per 24 hours per venue)
    const SYNC_COOLDOWN = 24 * 60 * 60 * 1000;
    const lastSynced = venueData.lastGoogleSync || 0;
    const now = Date.now();

    if (now - lastSynced < SYNC_COOLDOWN && !manualPlaceId) {
        const hoursRemaining = Math.ceil((SYNC_COOLDOWN - (now - lastSynced)) / (60 * 60 * 1000));
        console.warn(`[PLACES_SYNC] Throttled for ${venueData.name}. Last sync was recent. Try again in ${hoursRemaining}h.`);
        return {
            success: false,
            message: `Sync throttled. This venue was synced recently. Try again in ${hoursRemaining} hours.`
        };
    }

    console.log(`[PLACES_SYNC] Starting sync for ${venueData.name} (${venueId})...`);

    let placeId = manualPlaceId || venueData.googlePlaceId;

    // 1. If no placeId, search for it
    if (!placeId) {
        const searchResult = await searchPlace(venueData.name, venueData.address);
        if (searchResult) {
            placeId = searchResult.place_id;
            console.log(`[PLACES_SYNC] Found placeId: ${placeId} for ${venueData.name}`);
        } else {
            throw new Error(`Could not find a matching place on Google for "${venueData.name}".`);
        }
    }

    // 2. Fetch place details
    let details = await getPlaceDetails(placeId);
    if (!details) {
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[SYNC_BYPASS] Failed to fetch real details for ${placeId}. Using mock data for testing.`);
            details = {
                place_id: placeId,
                name: "The Brotherhood Lounge (Mock)",
                formatted_address: "119 Capitol Way N, Olympia, WA 98501",
                formatted_phone_number: "(360) 352-4161",
                website: "http://thebrotherhoodlounge.com/",
                geometry: {
                    location: { lat: 47.045, lng: -122.901 }
                }
            };
        } else {
            throw new Error(`Failed to fetch details for Google Place ID: ${placeId}`);
        }
    }

    // 3. Prepare updates
    const updates: Partial<Venue> = {
        googlePlaceId: placeId,
        lastGoogleSync: now,
        updatedAt: now
    };

    if (details.name) updates.name = details.name;
    if (details.formatted_phone_number) updates.phone = details.formatted_phone_number;
    if (details.website) updates.website = details.website;
    if (details.formatted_address) updates.address = details.formatted_address; // [NEW] Sync address

    // [NEW] Sync Ratings
    if (details.rating) updates.googleRating = details.rating;
    if (details.user_ratings_total) updates.googleReviewCount = details.user_ratings_total;

    // Construct Google Photo URL if available
    if (details.photos && details.photos.length > 0) {
        const photoRef = details.photos[0].photo_reference;
        const apiKey = process.env.GOOGLE_BACKEND_KEY;
        (updates as any).googlePhotoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photoRef}&key=${apiKey}`;
    }

    // Map geometry to location
    if (details.geometry?.location) {
        updates.location = {
            lat: details.geometry.location.lat,
            lng: details.geometry.location.lng
        };
    }

    // Map opening hours (simplified as a string for now, as used in ListingManagementTab)
    if (details.opening_hours?.weekday_text) {
        updates.hours = details.opening_hours.weekday_text.join('\n');
    }

    // 4. Update Database
    await venueRef.update(updates);

    // [CACHE_INVALIDATION] Force refresh on next fetch
    venueCache = null;

    console.log(`[PLACES_SYNC] Successfully synced ${venueData.name} with Google.`);

    return {
        success: true,
        message: `Synced ${venueData.name} with Google Places.`,
        updates
    };
};

/**
 * Pulse Calculation Service (MVP)
 * Calculates real-time pulse score based on recent clock-ins.
 * Weighting: (0-15m): 1.0, (15-30m): 0.8, (30-60m): 0.5
 */
export const getVenuePulse = async (venueId: string): Promise<number> => {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);

    const signalsSnapshot = await db.collection('signals')
        .where('venueId', '==', venueId)
        .where('type', '==', 'clock_in')
        .where('timestamp', '>', oneHourAgo)
        .get();

    let pulseScore = 0;

    signalsSnapshot.forEach(doc => {
        const data = doc.data() as Signal;
        const ageMinutes = (now - data.timestamp) / (60 * 1000);

        if (ageMinutes <= 15) {
            pulseScore += 1.0;
        } else if (ageMinutes <= 30) {
            pulseScore += 0.8;
        } else if (ageMinutes <= 60) {
            pulseScore += 0.5;
        }
    });

    return Math.round(pulseScore);
};

/**
 * Checks if a venue with the given Google Place ID is already claimed.
 */
export const checkVenueClaimStatus = async (googlePlaceId: string) => {
    const snapshot = await db.collection('venues')
        .where('googlePlaceId', '==', googlePlaceId)
        .limit(1)
        .get();

    if (snapshot.empty) {
        return { isClaimed: false, exists: false };
    }

    const doc = snapshot.docs[0];
    const data = doc.data() as Venue;

    return {
        isClaimed: !!data.ownerId,
        exists: true,
        venueId: doc.id,
        name: data.name
    };
};

/**
 * Onboards a new venue partner by creating or updating a venue and sync with Google.
 */
export const onboardVenue = async (googlePlaceId: string, ownerId: string, requesterRole?: string) => {
    console.log(`[ONBOARDING] Starting onboarding for Google Place: ${googlePlaceId} by User: ${ownerId} (Role: ${requesterRole})`);

    // 1. Check if venue exists with this placeId
    const status = await checkVenueClaimStatus(googlePlaceId);

    if (status.isClaimed) {
        console.warn(`[ONBOARDING] Failed: Venue ${googlePlaceId} already claimed.`);
        throw new Error('Venue is already claimed by another partner.');
    }

    let venueId = status.venueId;

    if (!status.exists) {
        // [SECURITY] Only Super-Admins can add a NEW venue to the city directory.
        if (requesterRole !== 'super-admin') {
            console.warn(`[SECURITY_ALERT] Unauthorized attempt to add a new bar by: ${ownerId}`);
            throw new Error('Only the OlyBars Super-Admin can add a new bar to the official directory. To request a listing, contact ryan@amaspc.com.');
        }

        // Create full skeleton venue with MVP defaults
        console.log(`[ONBOARDING] Creating new venue for ${googlePlaceId}`);
        const docRef = await db.collection('venues').add({
            name: 'Pending Sync...',
            googlePlaceId,
            ownerId,
            status: 'OPEN',
            type: 'bar',
            clockIns: 0,
            vibe: 'CHILL',
            vibeDefault: 'CHILL',
            assets: {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
            isVisible: true,
            isActive: true,
            tier_config: {
                is_directory_listed: true,
                is_league_eligible: false
            },
            attributes: {
                has_manned_bar: true,
                food_service: 'None',
                minors_allowed: true,
                noise_level: 'Conversational'
            },
            category: 'Dive'
        });
        venueId = docRef.id;
    } else {
        // Update existing venue with ownerId
        console.log(`[ONBOARDING] Updating existing venue ${venueId} with owner ${ownerId}`);
        await db.collection('venues').doc(venueId!).update({
            ownerId,
            updatedAt: Date.now()
        });
    }

    // Invalidate cache
    venueCache = null;

    // 2. User update (Role sync)
    const userRef = db.collection('users').doc(ownerId);
    await userRef.update({
        role: 'owner',
        [`venuePermissions.${venueId}`]: 'owner'
    });

    // 3. Trigger Google Sync
    console.log(`[ONBOARDING] Triggering Google Maps sync for ${venueId}...`);
    try {
        const syncResult = await syncVenueWithGoogle(venueId!);
        console.log(`[ONBOARDING] Success: Venue ${venueId} onboarded and synced.`);
        return {
            venueId,
            syncResult
        };
    } catch (error) {
        console.error(`[ONBOARDING] Warning: Sync failed for ${venueId}:`, error);
        return {
            venueId,
            syncError: (error as Error).message
        };
    }
};

/**
 * Add a member to a venue (Manager or Staff)
 */
export const addVenueMember = async (venueId: string, email: string, role: string, requestingUserId: string) => {
    const venueRef = db.collection('venues').doc(venueId);
    const venueDoc = await venueRef.get();
    if (!venueDoc.exists) throw new Error('Venue not found');
    const venueData = venueDoc.data() as Venue;

    // Verify permissions
    const isOwner = venueData.ownerId === requestingUserId;
    const isManager = venueData.managerIds?.includes(requestingUserId);
    const canAdd = isOwner || (isManager && venueData.managersCanAddUsers);

    if (!canAdd) {
        throw new Error('Unauthorized: You do not have permission to add members to this venue.');
    }

    // 1. Find user by email
    const usersRef = db.collection('users');
    const userSnapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (userSnapshot.empty) {
        throw new Error(`User with email ${email} not found. They must sign in to OlyBars once before being added to a team.`);
    }

    const userDoc = userSnapshot.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // 2. Update user's venuePermissions
    const venuePermissions = userData.venuePermissions || {};
    venuePermissions[venueId] = role;

    await userDoc.ref.update({ venuePermissions });

    // 3. If role is manager, add to venue's managerIds
    if (role === 'manager' || role === 'owner') {
        const managerIds = venueData.managerIds || [];
        if (!managerIds.includes(userId)) {
            managerIds.push(userId);
            await venueRef.update({ managerIds });

            // Invalidate cache
            venueCache = null;
        }
    }

    return { success: true, userId, email, role };
};

/**
 * Remove a member from a venue
 */
export const removeVenueMember = async (venueId: string, memberId: string, requestingUserId: string) => {
    const venueRef = db.collection('venues').doc(venueId);
    const venueDoc = await venueRef.get();
    if (!venueDoc.exists) throw new Error('Venue not found');
    const venueData = venueDoc.data() as Venue;

    // Verify permissions
    const isOwner = venueData.ownerId === requestingUserId;
    const isManager = venueData.managerIds?.includes(requestingUserId);
    const canRemove = isOwner || (isManager && venueData.managersCanAddUsers);

    if (!canRemove) {
        throw new Error('Unauthorized: You do not have permission to remove members from this venue.');
    }

    // 1. Update user's venuePermissions
    const userRef = db.collection('users').doc(memberId);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error('User not found');
    const userData = userDoc.data();

    const venuePermissions = userData!.venuePermissions || {};
    delete venuePermissions[venueId];

    await userRef.update({ venuePermissions });

    // 2. Remove from venue's managerIds if present
    const managerIds = (venueData.managerIds || []).filter(id => id !== memberId);
    await venueRef.update({ managerIds });

    // Invalidate cache
    venueCache = null;

    return { success: true };
};

/**
 * Fetch all members associated with a venue
 */
export const getVenueMembers = async (venueId: string) => {
    const usersRef = db.collection('users');
    // We query for users who have ANY role for this venue
    const snapshot = await usersRef.where(`venuePermissions.${venueId}`, 'in', ['owner', 'manager', 'staff']).get();

    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            uid: doc.id,
            email: data.email,
            displayName: data.displayName,
            role: data.venuePermissions[venueId],
            photoURL: data.photoURL
        };
    });
};

/**
 * Generate proactive AI insights for a venue using Gemini.
 */
export const generateVenueInsights = async (venueId: string) => {
    const stats = await getActivityStats(venueId, 'fortnight');
    const venueDoc = await db.collection('venues').doc(venueId).get();
    if (!venueDoc.exists) throw new Error('Venue not found');

    // Lazy import GeminiService to follow OlyBars AI Infrastructure Rules
    const { GeminiService } = await import('./services/geminiService.js');
    const gemini = new GeminiService();

    return await gemini.generateManagerSuggestion(stats, { id: venueId, ...venueDoc.data() });
};



/**
 * Flash Bounty Activator (Lazy Cron Logic)
 * Scans for scheduled deals that need to go live.
 */
export const syncFlashBounties = async () => {
    const now = Date.now();
    console.log(`[FLASH_SYNC] starting scan at ${new Date(now).toISOString()}`);

    try {
        // Query all pending scheduled deals across all venues
        // Since Firestore doesn't support easy cross-group sub-collection queries without collectionGroup,
        // we'll fetch venues that have scheduled deals or just use a collectionGroup query if allowed.
        // For simplicity in this environment, we'll use collectionGroup for 'scheduledDeals'.

        // Fetch ALL venues (safe for now given the count)
        const venuesSnapshot = await db.collection('venues').get();
        const pendingDeals: any[] = [];

        for (const venueDoc of venuesSnapshot.docs) {
            const venueId = venueDoc.id;
            // Fetch PENDING deals for this specific venue
            const dealsSnapshot = await db.collection('venues').doc(venueId).collection('scheduledDeals')
                .where('status', '==', 'PENDING')
                .get();

            dealsSnapshot.docs.forEach(doc => {
                const deal = doc.data();
                if (deal.startTime <= now) {
                    pendingDeals.push(doc);
                }
            });
        }

        if (pendingDeals.length === 0) {
            return { processed: 0 };
        }

        const batch = db.batch();
        let processed = 0;

        for (const dealDoc of pendingDeals) {
            const deal = dealDoc.data();
            const venueId = deal.venueId;
            const dealId = dealDoc.id;

            // 1. Mark deal as ACTIVE
            batch.update(dealDoc.ref, { status: 'ACTIVE', activatedAt: now });

            // 2. Update Venue with active deal
            const venueRef = db.collection('venues').doc(venueId);
            batch.update(venueRef, {
                'activeFlashBounty': {
                    id: dealId,
                    title: deal.title,
                    description: deal.description,
                    startTime: deal.startTime,
                    endTime: deal.endTime,
                    isActive: true,
                    isApproved: true
                },
                'deal': deal.title,
                'dealEndsIn': Math.ceil((deal.endTime - now) / 60000)
            });

            processed++;
        }

        await batch.commit();

        // Invalidate cache
        venueCache = null;

        console.log(`[FLASH_SYNC] Activated ${processed} bounties.`);
        return { processed };
    } catch (error) {
        console.error('[FLASH_SYNC] error:', error);
        throw error;
    }
};

/**
 * getPartnerHourlyReport: Aggregate signals by hour for a specific day.
 */
export const getPartnerHourlyReport = async (venueId: string, dayTimestamp?: number) => {
    const startOfDay = new Date(dayTimestamp || Date.now());
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const snapshot = await db.collection('activity_logs')
        .where('venueId', '==', venueId)
        .where('timestamp', '>=', startOfDay.getTime())
        .where('timestamp', '<', endOfDay.getTime())
        .get();

    const hourlyData: Record<number, { clockins: number, vibeReports: number, points: number }> = {};
    for (let i = 0; i < 24; i++) {
        hourlyData[i] = { clockins: 0, vibeReports: 0, points: 0 };
    }

    snapshot.forEach(doc => {
        const data = doc.data();
        const hour = new Date(data.timestamp).getHours();

        if (data.type === 'clock_in' || data.type === 'clockin') {
            hourlyData[hour].clockins++;
        } else if (data.type === 'vibe' || data.type === 'vibe_report') {
            hourlyData[hour].vibeReports++;
        }

        hourlyData[hour].points += (data.points || 0);
    });

    return {
        venueId,
        date: startOfDay.toISOString().split('T')[0],
        hourly: hourlyData
    };
};

/**
 * getUserPointHistory: Fetch paginated activity logs with receipt data for a user.
 */
export const getUserPointHistory = async (userId: string, limit: number = 50) => {
    const snapshot = await db.collection('activity_logs')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

/**
 * [SECURITY] Secure Private Data Access (Zero-Trust)
 */
export const getVenuePrivateData = async (venueId: string) => {
    const privateRef = db.collection('venues').doc(venueId).collection('private_data').doc('main');
    const privateDoc = await privateRef.get();

    if (!privateDoc.exists) {
        // Fallback for legacy venues: retrieve from parent document if present
        const venueDoc = await db.collection('venues').doc(venueId).get();
        if (!venueDoc.exists) return null;

        const venueData = venueDoc.data() as Venue;

        const legacyData = {
            partnerConfig: venueData.partnerConfig || null,
            menuStrategies: venueData.fullMenu?.reduce((acc, item) => {
                acc[item.id] = (item as any).margin_tier;
                return acc;
            }, {} as Record<string, string>) || {}
        };
        return legacyData;
    }

    return privateDoc.data();
};

export const updateVenuePrivateData = async (venueId: string, updates: any) => {
    const privateRef = db.collection('venues').doc(venueId).collection('private_data').doc('main');

    await privateRef.set({
        ...updates,
        updatedAt: Date.now()
    }, { merge: true });

    return { success: true };
};

/**
 * reviewBounty: Approve or reject a bounty submission (Commissioner Only)
 */
export const reviewBounty = async (submissionId: string, status: 'APPROVED' | 'REJECTED', reviewerId: string) => {
    const timestamp = Date.now();

    // 1. Verify Reviewer Role
    const reviewerDoc = await db.collection('users').doc(reviewerId).get();
    if (!reviewerDoc.exists) throw new Error('Reviewer not found');
    const reviewerData = reviewerDoc.data();

    if (reviewerData?.role !== 'admin' && reviewerData?.role !== 'super-admin') {
        throw new Error('Unauthorized: Commissioner credentials required.');
    }

    const submissionRef = db.collection('bounty_submissions').doc(submissionId);
    const submissionDoc = await submissionRef.get();
    if (!submissionDoc.exists) throw new Error('Submission not found');
    const submissionData = submissionDoc.data()!;

    if (submissionData.status !== 'PENDING') {
        throw new Error('This submission has already been processed.');
    }

    // 2. Update Submission Status
    await submissionRef.update({
        status,
        reviewerId,
        reviewedAt: timestamp
    });

    // 3. Update related Activity Log
    const logsSnapshot = await db.collection('activity_logs')
        .where('metadata.submissionId', '==', submissionId)
        .limit(1)
        .get();

    if (!logsSnapshot.empty) {
        const logDoc = logsSnapshot.docs[0];
        const logData = logDoc.data();

        await logDoc.ref.update({ status });

        // 4. If APPROVED, award the points to the user's permanent stats
        if (status === 'APPROVED') {
            const userRef = db.collection('users').doc(submissionData.userId);
            const userDoc = await userRef.get();
            const userData = userDoc.data();

            if (userDoc.exists) {
                await userRef.update({
                    'stats.seasonPoints': (userData?.stats?.seasonPoints || 0) + submissionData.pointsPotential,
                    'stats.competitionPoints': (userData?.stats?.competitionPoints || 0) + submissionData.pointsPotential
                });
            }
        }
    }

    return { success: true, status };
};

/**
 * getPendingBounties: Fetch all pending bounty submissions for admin review
 */
export const getPendingBounties = async () => {
    const snapshot = await db.collection('bounty_submissions')
        .where('status', '==', 'PENDING')
        .orderBy('submissionTime', 'asc')
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};
