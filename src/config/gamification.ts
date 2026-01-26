export const GAMIFICATION_CONFIG = {
    CURRENCY: {
        NAME: 'Well Water',
        UNIT: 'Drops',
        SYMBOL: '💧',
        COLOR: {
            TEXT: 'text-cyan-400',
            BG: 'bg-cyan-400/10',
            BORDER: 'border-cyan-400/30'
        }
    },
    REWARDS: {
        CLOCK_IN: 10,
        VIBE_REPORT: 5,
        VIBE_PHOTO: 15,
        EXPLORER_BONUS: 50,
        MARKETING_CONSENT: 15,
        REFERRAL: 100,
        GAME_REPORT_FLAT_BONUS: 5
    },
    PIONEER_CURVE: {
        trickle: 100,
        flowing: 50,
        gushing: 25,
        flooded: 10,
        dead: 100
    },
    LIMITS: {
        CLOCK_IN_PER_VENUE_12H: 1,
        CLOCK_IN_GLOBAL_12H: 2,
        VIBE_REPORT_PER_VENUE_NIGHT: 1,
        VIBE_COOLDOWN_GLOBAL_MINS: 30,
        VIBE_COOLDOWN_VENUE_MINS: 60
    },
    LEVELS: {
        LABEL: 'Depth',
        UNIT: 'ft'
    },
    COPY: {
        LEAK_DETECTED: "Leak Detected",
        SEAL_RESERVOIR: "Seal the Reservoir",
        TAP_SOURCE: "Tap the Source"
    }
};
