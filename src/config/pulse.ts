export type VibeLevel = 'dead' | 'mellow' | 'chill' | 'buzzing' | 'packed';

export const PULSE_CONFIG = {
    // Scoring Weights
    POINTS: {
        CLOCK_IN: 10.0, // Base points
        VIBE_REPORT: 5.0,
        PHOTO_VIBE: 10.0,
        VERIFIED_BONUS: 15.0, // For verified QR/GPS consent

        // [NEW] The Pioneer Curve (Dynamic Clock-in Points)
        VIBE_POINTS: {
            mellow: 100,
            chill: 50,
            buzzing: 25,
            packed: 10,
            dead: 100 // Legacy backward compatibility
        }
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
        PACKED: 0.85,   // > 85% Capacity
        BUZZING: 0.50,  // > 50% Capacity
        CHILL: 0.15,    // > 15% Capacity
        MELLOW: 0,      // < 15% Capacity
        DEAD: 0,        // [DEPRECATED]
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
        MELLOW_MEANING: "Quiet & intimate. Bounty active. < 15% cap.",
        CHILL_MEANING: "Social hum. Date night vibes. 15-50% cap.",
        BUZZING_MEANING: "High energy. Social peak. 51-90% cap.",
        PACKED_MEANING: "Physical peak. Party is here. > 90% cap.",
        DEAD_MEANING: "[DEPRECATED] See Mellow.",
        FLASH_BOUNTY_MEANING: "Ending soon! High urgency."
    }
};
