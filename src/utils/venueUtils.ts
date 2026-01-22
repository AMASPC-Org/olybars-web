import { Venue, VenueStatus } from '../types';

export type HoursStatus = 'open' | 'last_call' | 'closed';

/**
 * Determines the current status of a venue based on its hours metadata.
 * Accounts for "Last Call" (30 minutes before closing).
 */
export const getVenueStatus = (venue: Venue, now: Date = new Date()): HoursStatus => {
    if (!venue.hours) return 'open';

    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const parseTime = (timeStr: string): number => {
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':').map(Number);
        if (modifier === 'PM' && hours < 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;
        return hours * 60 + (minutes || 0);
    };

    let hoursRange: string | { open: string; close: string } | undefined;

    if (typeof venue.hours === 'string') {
        hoursRange = venue.hours;
    } else {
        hoursRange = venue.hours[currentDay];
    }

    if (!hoursRange) return 'closed';

    let openStr, closeStr;
    if (typeof hoursRange === 'string') {
        const parts = hoursRange.split(' - ');
        if (parts.length !== 2) return 'open';
        [openStr, closeStr] = parts;
    } else {
        openStr = hoursRange.open;
        closeStr = hoursRange.close;
    }

    const openTime = parseTime(openStr);
    let closeTime = parseTime(closeStr);

    // Handle midnight wrap
    if (closeTime <= openTime) {
        closeTime += 24 * 60;
    }

    // Adjust current time for midnight wrap context
    // If current time is early morning (e.g., 1 AM) and close time was 2 AM (today),
    // but the session started yesterday, we need to handle that.
    let adjustedCurrentTime = currentTime;
    if (currentTime < openTime && currentTime < closeTime - (24 * 60)) {
        adjustedCurrentTime += 24 * 60;
    }

    if (adjustedCurrentTime >= openTime && adjustedCurrentTime < closeTime) {
        // Last Call check (30 minutes before close)
        if (closeTime - adjustedCurrentTime <= 30) {
            return 'last_call';
        }
        return 'open';
    }

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
