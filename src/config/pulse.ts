import { GAMIFICATION_CONFIG } from './gamification.js';
export type VibeLevel = 'trickle' | 'flowing' | 'gushing' | 'flooded';
export const PULSE_CONFIG = {
    // Scoring Weights
    POINTS: {
        CLOCK_IN: GAMIFICATION_CONFIG.REWARDS.CLOCK_IN,
        VIBE_REPORT: GAMIFICATION_CONFIG.REWARDS.VIBE_REPORT,
        PHOTO_VIBE: GAMIFICATION_CONFIG.REWARDS.VIBE_PHOTO,
        VERIFIED_BONUS: GAMIFICATION_CONFIG.REWARDS.MARKETING_CONSENT,
        GAME_REPORT_BONUS: GAMIFICATION_CONFIG.REWARDS.GAME_REPORT_FLAT_BONUS,
        VIBE_POINTS: GAMIFICATION_CONFIG.PIONEER_CURVE
    },

    // NEW: Venue Physics (Density Calculation)
    PHYSICS: {
        DEFAULT_CAPACITY: 50, // Fallback if venue.capacity is undefined
        HEADCOUNT_WEIGHT: 1.0, // Multiplier for raw bodies
        ACTION_WEIGHT: 0.5,    // Multiplier for vibe checks/photos (virtual density)
    },

    // Time Windows (in milliseconds)
    WINDOWS: {
        LIVE_HEADCOUNT: 60 * 60 * 1000, // 60 Minutes (Rolling Window for Count)
        VIBE_REPORT: 45 * 60 * 1000, // 45 Minutes (Duration of manual vibe/status)
        BUZZ_HISTORY: 12 * 60 * 60 * 1000, // 12 Hours (Lookback for Score)
        STALE_THRESHOLD: 10 * 60 * 1000, // 10 Minutes (Trigger background refresh)
        DECAY_HALFLIFE: 60 * 60 * 1000, // 60 Minutes (Score drops by 50%)
        LCB_WINDOW: 12 * 60 * 60 * 1000, // 12 Hours (WA State LCB Compliance)
        CLOCK_IN_THROTTLE: 120 * 60 * 1000, // 120 Minutes (2 Hour Cooldown)
        SAME_VENUE_THROTTLE: 360 * 60 * 1000 // 360 Minutes (6 Hour Cooldown)
    },

    // Spatial Thresholds
    SPATIAL: {
        GEOFENCE_RADIUS: 22 // 22 Meters (approx. 75ft) to prevent crosstalk
    },

    // REFACTORED: Status based on % Saturation (0.0 to 1.0+)
    THRESHOLDS: {
        FLOODED: 0.85,   // > 85% Capacity
        GUSHING: 0.50,  // > 50% Capacity
        FLOWING: 0.15,    // > 15% Capacity
        TRICKLE: 0,      // < 15% Capacity
        FLASH_BOUNTY: 180, // < 180 mins remaining = Flash Bounty
        BUZZ_CLOCK_PRIORITY: 240 // < 240 mins = High priority in list
    },

    // Consensus Algorithm (User-Generated Pulse)
    CONSENSUS: {
        CLOCKINS_REQUIRED: 3,      // 3 Unique users
        CLOCKIN_WINDOW: 15 * 60 * 1000, // 15 Minutes
        VIBE_REPORTS_REQUIRED: 2,   // 2 Unique users reporting 'Packed'
        VIBE_WINDOW: 10 * 60 * 1000     // 10 Minutes
    },

    // Display Strings (User/Owner Facing)
    DESCRIPTIONS: {
        LIVE_MEANING: "Unique people checked in within the last 60 minutes.",
        TRICKLE_MEANING: "Quiet & intimate. Bounty active. < 15% cap.",
        FLOWING_MEANING: "Social hum. Steady stream. 15-50% cap.",
        GUSHING_MEANING: "High energy. Social peak. 51-85% cap.",
        FLOODED_MEANING: "Maximum depth. Party is here. > 85% cap.",
        FLASH_BOUNTY_MEANING: "Ending soon! High urgency."
    }
};
