import { EventSponsorshipPackage } from './sponsorship.js';

export interface EventAnalysis {
    confidenceScore: number; // 0-100
    issues: string[];
    lcbWarning: boolean;
    suggestions: string[];
    summary: string;
}

export interface AppEvent {
    id: string;
    venueId: string;
    venueName: string;
    title: string;
    type: 'karaoke' | 'trivia' | 'live_music' | 'bingo' | 'openmic' | 'other';
    date: string;
    time: string;
    description?: string;
    points?: number;
    status: 'pending' | 'approved' | 'rejected';
    submittedBy: string; // userId or 'guest'
    createdAt: number;
    updatedAt?: number;
    isLeagueEvent?: boolean;
    analysis?: EventAnalysis;
    sponsorshipPackages?: EventSponsorshipPackage[];
    sponsorIds?: string[]; // Array of makerIds who have active sponsorships for this event (for querying)

    // Rich Metadata (from Well 80 Quiz Specs)
    host?: string;
    prizes?: string;
    eventSpecials?: string;
    howItWorks?: string[];
    cluesUrl?: string;
    secondaryImage?: string;
}
