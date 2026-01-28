import { Venue, VenueStatus } from '../types';

export type HoursStatus = 'open' | 'last_call' | 'closed';

/**
 * Determines the current status of a venue based on its hours metadata.
 * Accounts for "Last Call" (30 minutes before closing).
 */
export const getVenueStatus = (venue: Venue, now: Date = new Date()): HoursStatus => {
    if (!venue.hours) return 'closed'; // Safety first: assume closed if unknown

    const dayNameFull = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNameShort = dayNameFull.substring(0, 3); // "Mon", "Tue"...
    const currentTime = now.getHours() * 60 + now.getMinutes();

    // Day lookup: handle full, short, and lowercase keys
    const getHoursByDay = (hours: any, dayFull: string) => {
        const short = dayFull.substring(0, 3);
        const lowerFull = dayFull.toLowerCase();
        const lowerShort = short.toLowerCase();

        return hours[short] || hours[dayFull] || hours[lowerFull] || hours[lowerShort];
    };

    const parseTime = (timeStr: string): number => {
        if (!timeStr) return 0;
        // Handle "Closed" or other non-time strings
        if (timeStr.toLowerCase().includes('closed')) return -1;

        // Safety: Ensure timeStr is a string
        const safeTimeStr = String(timeStr || "");
        const cleanTime = safeTimeStr.replace(/\u2013|\u2014/g, '-').trim();

        // Try matching AM/PM first
        const ampmMatch = cleanTime.match(/(\d+):?(\d+)?\s*(AM|PM)/i);
        if (ampmMatch) {
            let [_, hoursStr, minutesStr, modifier] = ampmMatch;
            let hours = parseInt(hoursStr, 10);
            let minutes = parseInt(minutesStr || '0', 10);

            if (modifier.toUpperCase() === 'PM' && hours < 12) hours += 12;
            if (modifier.toUpperCase() === 'AM' && hours === 12) hours = 0;
            return hours * 60 + minutes;
        }

        // Try matching 24h format (HH:mm)
        const h24Match = cleanTime.match(/^(\d{1,2}):(\d{2})$/);
        if (h24Match) {
            const hours = parseInt(h24Match[1], 10);
            const minutes = parseInt(h24Match[2], 10);
            return hours * 60 + minutes;
        }

        return 0;
    };

    const getStatusForDay = (dayName: string, isYesterday: boolean): HoursStatus | null => {
        let range: string | { open: string; close: string } | undefined;
        if (typeof venue.hours === 'string') {
            const lines = venue.hours.split('\n');
            const targetLine = lines.find(l => l.startsWith(dayName) || l.startsWith(dayName.substring(0, 3)));
            if (targetLine) range = targetLine.split(': ')[1];
        } else if (venue.hours && typeof venue.hours === 'object') {
            range = (venue.hours as any)[dayName] || (venue.hours as any)[dayName.substring(0, 3)];
        }

        if (!range || (typeof range === 'string' && range.toLowerCase().includes('closed'))) return null;

        let openStr, closeStr;
        if (typeof range === 'string') {
            const safeRange = String(range || "");
            const parts = safeRange.replace(/\u2013|\u2014/g, '-').trim().split(/\s*-\s*/);
            if (parts.length !== 2) return null;
            [openStr, closeStr] = parts;
        } else {
            openStr = range.open;
            closeStr = range.close;
        }

        const openTime = parseTime(openStr);
        let closeTime = parseTime(closeStr);
        if (openTime === -1 || closeTime === -1) return null;

        // Wrap close time if it's before open time (overnight shift)
        if (closeTime <= openTime) closeTime += 24 * 60;

        let checkTime = currentTime;
        if (isYesterday) {
            checkTime += 24 * 60; // We are looking at "Yesterday's" shift from current day's perspective
        }

        if (checkTime >= openTime && checkTime < closeTime) {
            return (closeTime - checkTime <= 30) ? 'last_call' : 'open';
        }

        return null;
    };

    // 1. Check if we are still in "Yesterday's" shift (e.g. 1AM Friday is Thursday's shift)
    const yesterdayDate = new Date(now);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayName = yesterdayDate.toLocaleDateString('en-US', { weekday: 'long' });
    const yesterdayStatus = getStatusForDay(yesterdayName, true);
    if (yesterdayStatus) return yesterdayStatus;

    // 2. Check "Today's" shift
    const todayStatus = getStatusForDay(dayNameFull, false);
    if (todayStatus) return todayStatus;

    return 'closed';
};


export const getNextFallbackVibe = (current: VenueStatus): VenueStatus | null => {
    switch (current) {
        case 'flooded': return 'gushing';
        case 'gushing': return 'flowing';
        case 'flowing': return 'trickle';
        case 'trickle': return 'flowing'; // Bounce back up to find activity
        default: return null;
    }
};

/**
 * Calculates the "True Vibe" using Bayesian inference.
 * Combines real-time signals with historical priors.
 */
export const calculateBayesianVibe = (
    currentScore: number,
    lastUpdated: number,
    historicalPrior: number = 10 // Default to "Trickle" baseline
): VenueStatus => {
    const now = Date.now();
    const minutesSinceUpdate = (now - lastUpdated) / (1000 * 60);

    // 1. Calculate Likelihood (Decayed Signal)
    // Decay: Halflife of 60 minutes
    const decayFactor = Math.pow(0.5, minutesSinceUpdate / 60);
    const likelihoodScore = currentScore * decayFactor;

    // 2. Weighting (Signal vs Prior)
    // If signal is fresh (< 2 hours), it dominates (80% weight).
    // As it ages, Prior takes over.
    const signalWeight = Math.max(0, 1 - (minutesSinceUpdate / 120)); // Linear fade over 2 hours
    const priorWeight = 1 - signalWeight;

    const posteriorScore = (likelihoodScore * signalWeight) + (historicalPrior * priorWeight);

    // 3. Map Posterior to State
    if (posteriorScore >= 91) return 'flooded';
    if (posteriorScore >= 51) return 'gushing';
    if (posteriorScore >= 16) return 'flowing';
    return 'trickle';
};

/**
 * Legacy wrapper for boolean check
 */
export const isVenueOpen = (venue: Venue, now: Date = new Date()): boolean => {
    return getVenueStatus(venue, now) !== 'closed';
};

// Helper for time calculations
export const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + (m || 0);
};

export const getEffectiveRules = (v: Venue) => {
    const rules = [...(v.happyHourRules || [])];
    if (v.happyHour?.startTime) {
        const isAlreadyAccounted = rules.some(r => r.startTime === v.happyHour!.startTime && r.endTime === v.happyHour!.endTime);
        if (!isAlreadyAccounted) {
            rules.push({
                id: 'legacy',
                startTime: v.happyHour.startTime,
                endTime: v.happyHour.endTime,
                days: v.happyHour.days || [],
                description: v.happyHour.description,
                specials: v.happyHourSpecials || v.happyHourSimple
            });
        }
    }
    return rules;
};
