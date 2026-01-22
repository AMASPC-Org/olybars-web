import { z } from 'zod';

export const ClockInSchema = z.object({
    venueId: z.string().min(1),
    lat: z.number(),
    lng: z.number(),
    verificationMethod: z.enum(['gps', 'qr']).optional(),
});

export const PlayClockInSchema = z.object({
    venueId: z.string().min(1),
    amenityId: z.string().min(1),
});

export const VibeCheckSchema = z.object({
    venueId: z.string().min(1),
    status: z.enum(['dead', 'mellow', 'chill', 'buzzing', 'packed']),
    hasConsent: z.boolean(),
    photoUrl: z.string().optional(),
    verificationMethod: z.enum(['gps', 'qr']).optional(),
    gameStatus: z.record(z.string(), z.object({
        status: z.enum(['open', 'taken', 'out_of_order']),
        timestamp: z.number().optional(),
        reportedBy: z.string().optional(),
        expiresAt: z.number().optional()
    })).optional(),
    soberFriendlyCheck: z.object({
        isGood: z.boolean(),
        reason: z.string().optional()
    }).optional()
});

export const AdminRequestSchema = z.object({
    type: z.enum(['CONTACT', 'LEAGUE_JOIN', 'MAKER_ONBOARD', 'ADMIN_SETUP']),
    payload: z.record(z.string(), z.any()),
    contactEmail: z.string().email().optional(),
    _hp_id: z.string().optional(), // Honeypot
});

export const UserUpdateSchema = z.object({
    handle: z.string().regex(/^[a-zA-Z0-9_]{3,15}$/, 'Handle must be 3-15 characters and alphanumeric (no special characters except underscores)').optional(),
    email: z.string().email().optional(),
    phone: z.string().regex(/^\d{3}-\d{3}-\d{4}$/, 'Invalid phone format. Please use 555-555-5555').optional().or(z.literal('')),
    favoriteDrink: z.string().optional(),
    favoriteDrinks: z.array(z.string()).optional(),
    homeBase: z.string().optional(),
    playerGamePreferences: z.array(z.string()).optional(),
    hasCompletedMakerSurvey: z.boolean().optional(),
    sms_opt_in: z.boolean().optional(),
    notificationSettings: z.object({
        allow_league_intel: z.boolean(),
        allow_pulse_alerts: z.boolean(),
        quiet_hours_start: z.string(),
        quiet_hours_end: z.string(),
    }).optional(),
    role: z.string().optional(), // We will gate this in the logic
});

export const ChatRequestSchema = z.object({
    question: z.string().min(1).max(1000),
    history: z.array(z.object({
        role: z.enum(['user', 'model']),
        content: z.string()
    })).optional(),
    userId: z.string().optional(),
    _hp_id: z.string().optional(), // Honeypot
});

export const GenerateImageSchema = z.object({
    prompt: z.string().min(1).max(2000),
    venueId: z.string().min(1),
});

export const VenueUpdateSchema = z.object({
    name: z.string().optional(),
    nicknames: z.array(z.string()).optional(),
    address: z.string().optional(),
    description: z.string().optional(),
    hours: z.string().optional().or(z.record(z.string(), z.object({ open: z.string(), close: z.string() }))),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    email: z.string().email().optional().or(z.literal('')),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    twitter: z.string().optional(),
    happyHourSimple: z.string().optional(),
    happyHourSpecials: z.string().optional(),
    happyHour: z.object({
        startTime: z.string(),
        endTime: z.string(),
        description: z.string(),
        days: z.array(z.string()).optional()
    }).optional(),
    amenities: z.array(z.string()).optional(),
    gameFeatures: z.array(z.object({
        id: z.string(),
        type: z.enum(['arcade_game', 'pinball_machine', 'pool_table', 'darts', 'skeeball', 'shuffleboard', 'foosball', 'cornhole', 'beer_pong', 'trivia', 'karaoke', 'giant_jenga', 'unknown']),
        name: z.string(),
        status: z.enum(['active', 'out_of_order']),
        count: z.number(),
        highlight: z.boolean().optional(),
        description: z.string().optional(),
        isLeaguePartner: z.boolean().optional(),
    })).optional(),
    vibe: z.string().optional(),
    vibeDefault: z.enum(['CHILL', 'BUZZING', 'PACKED']).optional(),
    assets: z.record(z.string(), z.boolean()).optional(),
    originStory: z.string().optional(),
    insiderVibe: z.string().optional(),
    geoLoop: z.enum(['Downtown_Walkable', 'Warehouse_Tumwater', 'Destination_Quest']).optional().or(z.literal('')),
    isLowCapacity: z.boolean().optional(),
    isSoberFriendly: z.boolean().optional(),
    venueType: z.enum(['bar_pub', 'restaurant_bar', 'brewery_taproom', 'lounge_club', 'arcade_bar', 'brewpub']).optional(),
    establishmentType: z.enum(['Bar Only', 'Bar & Restaurant', 'Restaurant with Bar', 'Brewpub']).optional(),
    isAllAges: z.boolean().optional(),
    isDogFriendly: z.boolean().optional(),
    hasOutdoorSeating: z.boolean().optional(),
    hasPrivateRoom: z.boolean().optional(),
    reservations: z.string().optional(),
    reservationUrl: z.string().url().optional().or(z.literal('')),
    openingTime: z.string().optional(),
    services: z.array(z.string()).optional(),
    weekly_schedule: z.record(z.string(), z.array(z.string())).optional(),
    makerType: z.enum(['Brewery', 'Distillery', 'Cidery', 'Winery', 'Other']).optional().or(z.literal('')),
    physicalRoom: z.boolean().optional(),
    carryingMakers: z.array(z.string()).optional(),
    isLocalMaker: z.boolean().optional(),
    isVerifiedMaker: z.boolean().optional(),
    localScore: z.number().min(0).max(100).optional(),
    isPaidLeagueMember: z.boolean().optional(),
    leagueEvent: z.enum(['karaoke', 'trivia', 'arcade', 'events', 'openmic', 'bingo', 'live_music', 'pool', 'darts']).nullable().optional(),
    triviaTime: z.string().optional(),
    triviaHost: z.string().optional(),
    triviaPrizes: z.string().optional(),
    triviaSpecials: z.string().optional(),
    triviaHowItWorks: z.array(z.string()).optional(),
    deal: z.string().optional(),
    dealEndsIn: z.number().optional(),
    sceneTags: z.array(z.string()).optional(),
    tier_config: z.object({
        is_directory_listed: z.boolean().optional(),
        is_league_eligible: z.boolean().optional()
    }).optional(),
    hasGameVibeCheckEnabled: z.boolean().optional(),
    happyHourMenu: z.array(z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        price: z.string(),
        category: z.enum(['food', 'drink'])
    })).optional(),
    happyHourRules: z.array(z.object({
        id: z.string(),
        startTime: z.string(),
        endTime: z.string(),
        days: z.array(z.string()),
        description: z.string(),
        specials: z.string().optional()
    })).optional(),

    // [PHASE 1] Full Menu Validation
    fullMenu: z.array(z.object({
        id: z.string().uuid().or(z.string()), // Accept UUID or legacy string IDs if needed
        name: z.string().min(1),
        type: z.enum(['Crisp', 'Hoppy', 'Malty', 'Dark', 'Sour', 'Cider', 'Seltzer', 'Cocktail', 'Wine', 'Food', 'Other']),
        description: z.string().max(140).optional(),
        stats: z.object({
            abv: z.number().optional(),
            ibu: z.number().optional(),
            price: z.string().optional(),
        }),
        margin_tier: z.enum(['High', 'Medium', 'Low', 'LossLeader']),
        ai_tags: z.array(z.string()).optional(),
        source: z.enum(['Manual', 'Untappd', 'Internal_Library']),
        status: z.enum(['Live', 'Library', 'Archived']),
        last_toggled_at: z.number().optional()
    })).optional(),

    clockIns: z.number().optional(),
    capacity: z.number().optional(),
    isVisible: z.boolean().optional(),
    isActive: z.boolean().optional(),
    location: z.object({
        lat: z.number(),
        lng: z.number()
    }).optional(),
    managersCanAddUsers: z.boolean().optional(),
    photos: z.array(z.object({
        id: z.string().optional(),
        url: z.string(),
        caption: z.string().optional(),
        allowMarketingUse: z.boolean().optional(),
        marketingStatus: z.enum(['pending-super', 'pending-venue', 'approved', 'rejected']).optional(),
        superAdminApprovedBy: z.string().optional(),
        venueAdminApprovedBy: z.string().optional(),
        isApprovedForFeed: z.boolean().optional(),
        isApprovedForSocial: z.boolean().optional(),
        timestamp: z.number().optional(),
        userId: z.string().optional(),
    })).optional(),
    social_auto_sync: z.boolean().optional(),
    membershipRequired: z.boolean().optional(),
    guestPolicy: z.string().optional(),
    isCinderella: z.boolean().optional(),
    cinderellaHours: z.string().optional(),
    privateSpaces: z.array(z.object({
        name: z.string(),
        capacity: z.number(),
        description: z.string(),
        bookingLink: z.string().url().optional().or(z.literal(''))
    })).optional(),
    scraper_config: z.array(z.object({
        id: z.string(),
        url: z.string(),
        target: z.enum(['EVENTS', 'MENU', 'NEWSLETTER', 'SOCIAL_FEED', 'WEBSITE']),
        isEnabled: z.boolean(),
        status: z.enum(['pending', 'active', 'failed', 'partial']),
        lastScraped: z.number().optional(),
        error: z.string().optional()
    })).optional(),
    is_scraping_enabled: z.boolean().optional(),
    scrape_source_url: z.string().optional(),
});

export const VenueOnboardSchema = z.object({
    googlePlaceId: z.string().min(1),
});
export const AppEventSchema = z.object({
    venueId: z.string().min(1),
    venueName: z.string().min(1),
    title: z.string().min(1).max(100),
    type: z.enum(['karaoke', 'trivia', 'live_music', 'bingo', 'openmic', 'other']),
    date: z.string().min(1),
    time: z.string().min(1),
    description: z.string().max(500).optional(),
    points: z.number().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
    isLeagueEvent: z.boolean().optional(),
    distributeToMedia: z.boolean().optional(),
    host: z.string().max(100).optional(),
    prizes: z.string().max(200).optional(),
    eventSpecials: z.string().max(200).optional(),
    howItWorks: z.array(z.string()).optional(),
    cluesUrl: z.string().url().optional().or(z.literal('')),
});

export const VenueSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    googlePlaceId: z.string().optional(),
    hours: z.any().optional(), // Flexible for now (string or object)
    venueType: z.enum(['bar_pub', 'restaurant_bar', 'brewery_taproom', 'lounge_club', 'arcade_bar', 'brewpub', 'private_club', 'winery_tasting']).optional(),
    sceneTags: z.array(z.string()).optional(),
    foodService: z.enum(['full_kitchen', 'limited_kitchen', 'snacks', 'none_byof']).optional(),
    status: z.enum(['dead', 'mellow', 'chill', 'buzzing', 'packed']).optional(),
    clockIns: z.number().optional(),
    capacity: z.number().optional(),
    isPaidLeagueMember: z.boolean().optional(),
    pointBank: z.number().optional(),
    pointBankLastReset: z.number().optional(),
    vibe: z.string().optional(),
    insiderVibe: z.string().optional(),
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    originStory: z.string().optional(),
    geoLoop: z.string().optional(),
    isVerifiedMaker: z.boolean().optional(),
    isLocalMaker: z.boolean().optional(),
    physicalRoom: z.boolean().optional(),
    coordinates: z.object({
        x: z.number(),
        y: z.number()
    }).optional(),
    location: z.object({
        lat: z.number(),
        lng: z.number()
    }),
    address: z.string().optional(),
    isActive: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    isHistoricalAnchor: z.boolean().optional(),
    historySnippet: z.string().optional(),
    flashBounties: z.array(z.any()).optional(),
    activeFlashBountyId: z.string().optional(),
    deal: z.string().optional(),
    dealEndsIn: z.number().optional(),
    vibeDefault: z.string().optional(),
    happyHourSpecials: z.string().optional(),
    happyHour: z.object({
        startTime: z.string(),
        endTime: z.string(),
        description: z.string(),
        days: z.array(z.string()).optional()
    }).optional(),
    gameFeatures: z.array(z.any()).optional(),
    ownerId: z.string().optional(),
    managerIds: z.array(z.string()).optional(),
    tier_config: z.object({
        is_directory_listed: z.boolean().optional(),
        is_league_eligible: z.boolean().optional()
    }).optional(),
    attributes: z.record(z.string(), z.any()).optional(),
    fullMenu: z.array(z.any()).optional(),
    currentBuzz: z.object({
        score: z.number(),
        lastUpdated: z.number()
    }).optional(),
    website: z.string().optional(),
    phone: z.string().optional(),
    isAllAges: z.boolean().optional(),
    isDogFriendly: z.boolean().optional(),
    isSoberFriendly: z.boolean().optional(),
    hasOutdoorSeating: z.boolean().optional(),
    weekly_schedule: z.record(z.string(), z.array(z.string())).optional(),
    happyHourRules: z.array(z.any()).optional(),
    happyHourMenu: z.array(z.any()).optional(),
    isBoutique: z.boolean().optional(),
    isLgbtq: z.boolean().optional(),
    isLowCapacity: z.boolean().optional(),
    partnerConfig: z.object({
        tier: z.enum(['FREE', 'DIY', 'PRO', 'AGENCY']),
        billingCycleStart: z.number(),
        flashBountiesUsed: z.number(),
        metaSync: z.object({
            facebookPageId: z.string().optional(),
            instagramBusinessId: z.string().optional(),
            pageToken: z.string().optional(),
            accessToken: z.string().optional(),
            lastSync: z.number().optional(),
            autoPublishEnabled: z.boolean().optional(),
        }).optional()
    }).optional(),
    social_auto_sync: z.boolean().optional(),
    membershipRequired: z.boolean().optional(),
    guestPolicy: z.string().optional(),
    isCinderella: z.boolean().optional(),
    cinderellaHours: z.string().optional(),
    privateSpaces: z.array(z.object({
        name: z.string(),
        capacity: z.number(),
        description: z.string(),
        bookingLink: z.string().url().optional().or(z.literal(''))
    })).optional(),
});

export const BountyReviewSchema = z.object({
    status: z.enum(['APPROVED', 'REJECTED'])
});
