export type VenueStatus = "trickle" | "flowing" | "gushing" | "flooded";

export enum PartnerTier {
  LOCAL = "local",
  DIY = "diy",
  PRO = "pro",
  AGENCY = "agency",
}

import {
  TIER_CONFIG as GLOBAL_TIER_CONFIG,
  TierFeatures,
} from "../config/tiers.js";
import { BrandDNA } from "./schemas.js";

export interface TierLimits extends TierFeatures {}

export const TIER_CONFIG = GLOBAL_TIER_CONFIG;

export interface PartnerConfig {
  tier: PartnerTier;
  billingCycleStart: number; // Timestamp for monthly reset
  flashBountiesUsed: number; // Counter
  metaSync?: MetaSyncConfig; // [NEW] OAuth and Page IDs
}

export interface MetaSyncConfig {
  facebookPageId?: string;
  instagramBusinessId?: string;
  pageToken?: string; // [NEW] Page-level access token
  accessToken?: string; // [LEGACY/ENCRYPTED]
  lastSync?: number; // [NEW]
  autoPublishEnabled: boolean;
}

export interface FlashBounty {
  id?: string;
  venueId?: string;
  title: string;
  description: string;
  price?: string;
  startTime: number;
  endTime: number;
  isActive: boolean;
  isApproved?: boolean; // Admin approval required
  termsAccepted?: boolean;
  offerDetails?: string; // [NEW] e.g. "BOGO"
  terms?: string; // [NEW] e.g. "Limit 2"
  category: "food" | "drink" | "other"; // [NEW] Classified deal type
  bounty_task_description?: string; // [NEW] e.g. "Upload a photo of your receipt"
}

export interface ScheduledDeal {
  id?: string;
  venueId?: string;
  title: string;
  description: string;
  price?: string;
  startTime: number;
  endTime: number;
  durationMinutes: number;
  status: "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  createdBy: "ARTIE" | "MANUAL";
  staffBriefingConfirmed: boolean;
  offerDetails?: string;
  terms?: string;
  category: "food" | "drink" | "other"; // [NEW] Classified deal type
  bounty_task_description?: string;
  createdAt?: any; // Firestore serverTimestamp
}

export type VenueType =
  | "bar_pub"
  | "restaurant_bar"
  | "brewery_taproom"
  | "lounge_club"
  | "arcade_bar"
  | "brewpub"
  | "private_club"
  | "winery_tasting";

export type ScrapeTarget =
  | "EVENTS"
  | "MENU"
  | "NEWSLETTER"
  | "SOCIAL_FEED"
  | "WEBSITE";

export interface ScraperSource {
  id: string; // UUID
  url: string;
  target: ScrapeTarget;
  isEnabled: boolean;
  lastScraped?: number;
  status: "active" | "error" | "pending";
  errorMsg?: string;
  consecutiveFailures?: number; // [NEW] For backoff logic
  contentHash?: string; // [NEW] MD5 of innerText for change detection
  robotsCache?: {
    // [NEW] Politeness check
    verdict: "allow" | "disallow";
    checkedAt: number;
  };
  frequency?: "daily" | "weekly" | "monthly"; // [NEW] Tier-based frequency
  nextRun?: number; // [NEW] Computed timestamp for UI
  extractionMode?: ScrapeTarget; // [NEW] Explicit mode (Events, Menu, etc)
}

export interface SocialPostDraft {
  id: string; // UUID
  venueId: string;
  sourceType: "NEWSLETTER" | "EVENTS_DIGEST" | "MENU_PROMO";
  content: string; // The AI generated text
  sourceUrl?: string; // Citation
  status: "DRAFT" | "APPROVED" | "POSTED";
  createdAt: number;
}

// [PHASE 1] Menu Module Schema
export enum MenuItemType {
  Crisp = "Crisp",
  Hoppy = "Hoppy",
  Malty = "Malty",
  Dark = "Dark",
  Sour = "Sour",
  Cider = "Cider",
  Seltzer = "Seltzer",
  Cocktail = "Cocktail",
  Wine = "Wine",
  Food = "Food",
  Other = "Other",
}

export enum MenuItemStatus {
  Live = "Live",
  Library = "Library",
  Archived = "Archived",
}

export enum MarginTier {
  High = "High", // High Profit
  Medium = "Medium", // Standard
  Low = "Low", // Low Profit
  LossLeader = "LossLeader",
}

export enum MenuSource {
  Manual = "Manual",
  Untappd = "Untappd",
  Internal_Library = "Internal_Library",
}

export interface MenuItemStats {
  abv?: number; // Required for alcohol
  ibu?: number;
  price?: string; // e.g. "$7"
}

export interface MenuItem {
  id: string; // UUID
  name: string;
  type: MenuItemType;
  description?: string; // Max 140 chars
  stats: MenuItemStats;

  // [CRITICAL] AI & Ops Fields
  // margin_tier: MarginTier; // MOVED TO PRIVATE DATA
  ai_tags?: string[]; // Auto-generated
  source: MenuSource;
  status: MenuItemStatus;
  last_toggled_at?: number; // Timestamp
}

export interface HappyHourMenuItem {
  id: string;
  name: string;
  description?: string;
  price: string;
  category: "food" | "drink";
}

export interface HappyHourRule {
  id: string;
  startTime: string;
  endTime: string;
  days: string[];
  description: string;
  specials?: string;
}

export type SceneTag =
  | "dive"
  | "speakeasy"
  | "sports"
  | "tiki_theme"
  | "wine_focus"
  | "cocktail_focus"
  | "martini_bar"
  | "lgbtq"
  | "patio_garden";

export type FoodServiceLevel =
  | "none_byof"
  | "snacks"
  | "limited_kitchen"
  | "full_kitchen";

export type GameFeatureStatus = "active" | "out_of_order";
export interface GameFeature {
  id: string; // e.g. "pinball_godzilla" or just "pool_table_1"
  type:
    | "arcade_game"
    | "pinball_machine"
    | "pool_table"
    | "darts"
    | "skeeball"
    | "shuffleboard"
    | "foosball"
    | "cornhole"
    | "beer_pong"
    | "trivia"
    | "karaoke"
    | "giant_jenga"
    | "console_gaming"
    | "unknown";
  name: string; // Display name e.g. "Godzilla Pinball"
  status: GameFeatureStatus;
  count: number;
  highlight?: boolean; // If true, show in summary tags
  description?: string; // [NEW] For artie lore or condition notes
  isLeaguePartner?: boolean; // [NEW] For tracking league assets
}

export interface PrivateSpace {
  name: string;
  capacity: number;
  description: string;
  bookingLink?: string;
}

export interface GameStatus {
  status: "open" | "taken" | "out_of_order";
  timestamp: number;
  reportedBy?: string;
  expiresAt?: number;
}

export interface LeagueEvent {
  id: string;
  venueId: string;
  title: string;
  description?: string;
  type:
    | "trivia"
    | "karaoke"
    | "live_music"
    | "dj"
    | "bingo"
    | "sports"
    | "comedy"
    | "happy_hour"
    | "other";
  startTime: number; // UTC timestamp
  date: string; // [NEW] ISO YYYY-MM-DD
  time?: string; // [NEW] HH:mm
  pointsAwarded: number; // Default 25
  sourceUrl?: string;
  source: "google_calendar" | "facebook" | "manual" | "automation"; // [NEW] Added automation
  sourceConfidence: number; // 0.0 - 1.0 (from AI)
  lastScraped?: number;
  distributeToMedia?: boolean; // [NEW] For MediaDistributionService

  // [NEW] Approval Workflow
  status: "PENDING" | "APPROVED" | "REJECTED";
  originalDescription?: string; // Raw scraped text for reference/revert
}

export interface Venue {
  id: string;
  name: string;
  venueType: VenueType; // [NEW] Primary Business Model
  sceneTags?: SceneTag[]; // [NEW] Scene Tags

  status: VenueStatus;
  clockIns: number;
  capacity?: number; // [NEW] Total venue capacity for busyness calculations
  isPaidLeagueMember?: boolean;
  nicknames?: string[];

  brand_dna?: BrandDNA; // [NEW] Central visual identity for Schmidt

  // Legacy/Computed fields for Frontend
  deal?: string;
  dealEndsIn?: number;

  // Robust Deal Data
  flashBounties?: FlashBounty[];
  activeFlashBountyId?: string;
  activeFlashBounty?: FlashBounty;

  vibe: string;
  coordinates: { x: number; y: number };
  location?: { lat: number; lng: number };
  currentBuzz?: {
    score: number;
    lastUpdated: number;
  };
  projectedVibe?: VenueStatus; // [NEW] Bayesian Estimate

  // Events & Hours
  leagueEvent?:
    | "karaoke"
    | "trivia"
    | "arcade"
    | "events"
    | "openmic"
    | "bingo"
    | "live_music"
    | "pool"
    | "darts"
    | "shuffleboard"
    | "pinball"
    | null;
  triviaTime?: string;
  triviaHost?: string;
  triviaPrizes?: string;
  triviaSpecials?: string;
  triviaHowItWorks?: string[];
  eventDescription?: string;
  happyHourSimple?: string;
  happyHourSpecials?: string;
  happyHour?: {
    startTime: string;
    endTime: string;
    description: string;
    days?: string[];
  };
  happyHourRules?: HappyHourRule[];

  happyHourMenu?: HappyHourMenuItem[];
  // [PHASE 1] Full Menu (Library + Live)
  fullMenu?: MenuItem[];

  // Bonus Points
  clockin_bonus_points?: number;
  bonus_expires_at?: number;

  alertTags?: string[];
  isFavorite?: boolean;
  isFeatured?: boolean; // [NEW] Added for backward compatibility/visual tagging
  featureWeight?: number; // [NEW] Sort priority for featured venues
  description?: string;
  address?: string;
  email?: string;
  isHistoricalAnchor?: boolean;
  historySnippet?: string;
  hours?: string | { [key: string]: { open: string; close: string } };
  phone?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  venueName?: string;
  source?: "google_calendar" | "facebook" | "manual";
  ticketLink?: string;
  cheatCodeUrl?: string;
  orderUrl?: string;
  giftCardUrl?: string;
  directMenuUrl?: string; // [NEW] Link to Untappd/DigitalPour/Image
  newsletterUrl?: string; // [NEW] Link to Mailchimp/Newsletter
  loyalty_signup_url?: string; // [NEW] Link to external loyalty (Toast/Square)
  hero_item?: {
    name: string;
    description: string;
    photoUrl: string;
  }; // [NEW] High-margin item for post-clock-in upsell

  // Google Places Data
  googleRating?: number;
  googleReviewCount?: number;

  partnerConfig?: PartnerConfig; // MOVED TO PRIVATE DATA (But used in Admin/Owner)

  ownerId?: string;
  managerIds?: string[];

  // Inventory / Taxonomy [NEW]
  foodService: FoodServiceLevel; // [NEW] Replaces attributes.food_service
  gameFeatures?: GameFeature[]; // [NEW] Replaces amenityDetails

  // Discovery Attributes
  amenities?: string[]; // e.g. ['Pool', 'Shuffleboard', 'Darts']
  weekly_schedule?: Record<string, string[]>; // e.g. { 'thursday': ['Karaoke'] }

  // [NEW] One-Time & Featured Events
  special_events?: {
    id: string;
    title: string;
    date: string; // ISO 2023-10-31
    startTime: string; // 20:00
    endTime?: string;
    description?: string;
    type: "music" | "activity" | "special";
    is_featured?: boolean; // Manual override (Weight = 100)
    host?: string;
    prizes?: string;
    eventSpecials?: string;
    howItWorks?: string[];
    cluesUrl?: string;
  }[];

  tier_config: {
    is_directory_listed: boolean;
    is_league_eligible: boolean;
  };

  attributes: {
    has_manned_bar: boolean;
    minors_allowed: boolean;
    noise_level: "Conversational" | "Lively" | "Loud/Music";
  };

  makerType?: "Brewery" | "Distillery" | "Cidery" | "Winery";
  physicalRoom?: boolean;
  insiderVibe?: string;
  originStory?: string;
  geoLoop?: "Downtown_Walkable" | "Warehouse_Tumwater" | "Destination_Quest";
  isLowCapacity?: boolean;
  isSoberFriendly?: boolean;
  soberFriendlyReports?: {
    userId: string;
    timestamp: number;
    reason?: string;
  }[];
  soberFriendlyNote?: string; // Artie's explanation if badge is disabled
  isBoutique?: boolean;
  isActive?: boolean;
  isVisible?: boolean;
  scavengerHunts?: {
    title: string;
    partnerVenues: string[];
    badgeId: string;
  }[];
  establishmentType?:
    | "Bar Only"
    | "Bar & Restaurant"
    | "Restaurant with Bar"
    | "Brewpub"; // Likely deprecated by venueType
  googlePlaceId?: string;
  vibeDefault?: VenueStatus;

  hasGameVibeCheckEnabled?: boolean;
  liveGameStatus?: Record<string, GameStatus>;
  assets?: Record<string, boolean>; // Support for legacy asset toggles until fully migrated to gameFeatures

  manualStatus?: VenueStatus;
  manualStatusExpiresAt?: number;
  manualClockIns?: number;
  manualClockInsExpiresAt?: number;

  pointBank?: number;
  pointBankLastReset?: number;

  updatedAt?: number;
  managersCanAddUsers?: boolean;
  lastGoogleSync?: number;

  photos?: {
    id?: string;
    url: string;
    caption?: string;
    allowMarketingUse?: boolean;
    marketingStatus?:
      | "pending-super"
      | "pending-venue"
      | "approved"
      | "rejected";
    superAdminApprovedBy?: string;
    venueAdminApprovedBy?: string;
    isApprovedForFeed?: boolean;
    isApprovedForSocial?: boolean;
    timestamp?: number;
    userId?: string;
  }[];
  isHQ?: boolean;
  isLocalMaker?: boolean;
  carryingMakers?: string[]; // IDs of venues that carry this maker's products
  isVerifiedHost?: boolean;
  isVerifiedMaker?: boolean;
  localScore?: number;

  // Taxonomy Update [NEW]
  isAllAges?: boolean;
  isDogFriendly?: boolean;
  hasOutdoorSeating?: boolean;
  hasPrivateRoom?: boolean;
  privateSpaces?: PrivateSpace[];
  reservations?: string;
  reservationUrl?: string;
  reservationPolicy?: string;
  openingTime?: string;
  services?: string[];

  // [BETA BATTALION] Scraper & Consensus Metadata
  partner_tier: PartnerTier;
  /** @deprecated Use scraper_config instead */
  scrape_source_url?: string;
  scraper_config?: ScraperSource[];
  last_scrape_timestamp?: number;
  is_scraping_enabled: boolean;
  isConsensusPacked?: boolean; // Tracked internally for alert debouncing

  // [NEW] Social Engine
  social_auto_sync: boolean;
  auto_sync_sources?: ("facebook" | "instagram" | "website")[];
  wifiPassword?: string;
  posKey?: string;
  is_manually_blocked?: boolean; // [NEW] Admin override to prevent scraping

  // [NEW] AI Refinery Draft
  ai_draft_profile?: {
    identity: {
      name: string;
      type: string;
      established_year?: number;
      website_url?: string;
      social_links?: {
        facebook?: string;
        instagram?: string;
      };
    };
    features: {
      has_pool?: boolean;
      has_darts?: boolean;
      has_karaoke?: boolean;
      has_trivia?: boolean;
      has_open_mic?: boolean;
      has_live_music?: boolean;
      has_dance_floor?: boolean;
      has_jukebox?: boolean;
      has_arcade_games?: boolean;
      has_food?: boolean;
      has_outdoor_seating?: boolean;
      has_wifi?: boolean;
    };
    weekly_schedule: Array<{
      day: string;
      open_time?: string;
      close_time?: string;
      events: Array<{
        name: string;
        type: string;
        start_time: string;
        frequency: string;
        recurrence_note: string;
        description?: string;
        external_url?: string;
      }>;
    }>;
    happy_hour?: {
      has_happy_hour: boolean;
      schedule?: string;
      drinks_special?: string;
      food_special?: string;
    };
    inventory?: {
      local_makers_featured: string[];
      signature_drinks: string[];
    };
    menu_highlights?: {
      hero_item?: string;
      breakfast_service_level?: "Full" | "Limited" | "None";
      kitchen_status?: string;
    };
    vibe: {
      headline: string;
      insider_tip: string;
      audience_tags: string[];
    };
    metadata: {
      confidence_score: number;
      data_sources: string[];
      verification_notes?: string;
      location?: { lat: number; lng: number };
      coordinates?: { x: number; y: number };
    };
    synced_at: any;
    status: "needs_review" | "approved" | "rejected";
  };

  // [BETA BATTALION] Membership & Cinderella Protocols
  membershipRequired?: boolean;
  guestPolicy?: string; // e.g. "Guests must be signed in by a member. 3 guests max."
  isCinderella?: boolean; // Time-gated visibility
  cinderellaHours?: string; // Optional override if different from venue.hours
}

export interface AmenityDetail {
  id: string; // e.g. "darts"
  name: string; // e.g. "Darts"
  count: number; // total units
  available?: number; // currently free
  isLeaguePartner?: boolean; // If this specific amenity is part of the league
  artieLore?: string; // Specific lore for this amenity
}

export interface VenueInsight {
  type: "YIELD_BOOST" | "TREND_ALERT" | "COMPLIANCE_CHECK";
  message: string;
  actionLabel: string;
  actionSkill: string;
  actionParams: Record<string, unknown>;
  pointCost?: number;
  potentialImpact: "HIGH" | "MEDIUM" | "LOW";
}
