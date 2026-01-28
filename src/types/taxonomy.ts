/**
 * OlyBars Official Taxonomy
 * 
 * This file defines the strict distinction between point-awarding "League Events"
 * and non-point (or base-point) "Venue Specials".
 */

export enum TaxonomyType {
    LEAGUE_EVENT = 'league_event',
    NON_LEAGUE_EVENT = 'non_league_event',
    HAPPY_HOUR = 'happy_hour',
    VENUE_SPECIAL = 'venue_special',
    FLASH_BOUNTY = 'flash_bounty'
}

export enum EventCategory {
    TRIVIA = 'trivia',
    KARAOKE = 'karaoke',
    LIVE_MUSIC = 'live_music',
    COMEDY = 'comedy',
    BINGO = 'bingo',
    TOURNAMENT = 'tournament',
    DJ_SET = 'dj_set',
    OTHER = 'other'
}

export enum SpecialCategory {
    HAPPY_HOUR = 'happy_hour',
    FOOD_DEAL = 'food_deal',
    DRINK_DEAL = 'drink_deal',
    INDUSTRY_NIGHT = 'industry_night',
    THEME_NIGHT = 'theme_night',
    SEASONAL = 'seasonal'
}

export interface ActivityBase {
    id: string;
    venueId: string;
    title: string;
    description: string;
    type: TaxonomyType;
    sourceUrl?: string;
    lastUpdated: number;
}

/**
 * League Events: Point-awarding activities (+25 pts).
 */
export interface TaxonomyLeagueEvent extends ActivityBase {
    type: TaxonomyType.LEAGUE_EVENT;
    category: EventCategory;
    startTime: string; // ISO String
    endTime?: string;  // ISO String
    pointsAwarded: number; // Default: 25
    isRecurring: boolean;
    recurrenceRule?: string;
}

/**
 * Non-League Events: Activities that don't award points (0 pts).
 */
export interface NonLeagueEvent extends ActivityBase {
    type: TaxonomyType.NON_LEAGUE_EVENT;
    category: EventCategory;
    startTime: string; // ISO String
    endTime?: string;
}

/**
 * Happy Hour: Window-based multi-item deals. 0 pts.
 */
export interface HappyHour extends ActivityBase {
    type: TaxonomyType.HAPPY_HOUR;
    days: number[]; // 0-6
    startTime: string; // e.g. "16:00"
    endTime: string;   // e.g. "18:00"
    summary: string;   // e.g. "$1 off drafts"
}

/**
 * Venue Specials: Theme-based or Item-focused recurring deals.
 */
export interface VenueSpecial extends ActivityBase {
    type: TaxonomyType.VENUE_SPECIAL;
    category: SpecialCategory;
    validDays: number[]; // 0-6
    startTime?: string;
    endTime?: string;
    price_point?: string;
}
